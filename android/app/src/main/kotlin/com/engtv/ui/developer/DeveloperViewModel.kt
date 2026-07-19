package com.engtv.ui.developer

import android.content.SharedPreferences
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.engtv.data.api.AuthTokenHolder
import com.engtv.data.api.EngTvApi
import com.engtv.data.models.AdminLoginRequest
import com.engtv.data.models.Source
import com.engtv.data.models.SourceCreateRequest
import com.engtv.data.models.SourceUpdateRequest
import com.engtv.data.models.SyncHistory
import com.engtv.data.repository.CategoryRepository
import com.engtv.data.repository.ChannelRepository
import com.engtv.data.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Named

data class DeveloperUiState(
    val isAuthenticated: Boolean = false,
    val isRestoringAuth: Boolean = true,
    val loginError: String? = null,
    val isLoggingIn: Boolean = false,
    val sources: List<Source> = emptyList(),
    val syncHistory: List<SyncHistory> = emptyList(),
    val isLoading: Boolean = false,
    val isSyncingAll: Boolean = false,
    val error: String? = null,
    val showAddDialog: Boolean = false,
    val editingSource: Source? = null,
    val showDeleteConfirm: Source? = null,
    val showSyncHistory: Boolean = false,
    val syncStatus: String = "idle",
    val lastSyncTime: String? = null,
)

@HiltViewModel
class DeveloperViewModel @Inject constructor(
    private val channelRepository: ChannelRepository,
    private val categoryRepository: CategoryRepository,
    private val settingsRepository: SettingsRepository,
    private val api: EngTvApi,
    @Named("encrypted") private val securePrefs: SharedPreferences,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DeveloperUiState())
    val uiState: StateFlow<DeveloperUiState> = _uiState.asStateFlow()

    init {
        val savedToken = securePrefs.getString("admin_token", null)
        if (savedToken != null && !AuthTokenHolder.isExpired()) {
            AuthTokenHolder.token = savedToken
            _uiState.value = _uiState.value.copy(isAuthenticated = true, isRestoringAuth = true)
            loadSources()
        }
        _uiState.value = _uiState.value.copy(isRestoringAuth = false)

        AuthTokenHolder.onUnauthorized = {
            securePrefs.edit().remove("admin_token").apply()
            _uiState.value = DeveloperUiState()
        }
    }

    fun login(password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoggingIn = true, loginError = null)
            try {
                val response = api.adminLogin(AdminLoginRequest(password))
                AuthTokenHolder.token = response.token
                securePrefs.edit().putString("admin_token", response.token).apply()
                _uiState.value = _uiState.value.copy(
                    isAuthenticated = true,
                    isLoggingIn = false,
                    loginError = null,
                )
                loadSources()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoggingIn = false,
                    loginError = "فشل تسجيل الدخول: ${e.message?.take(100) ?: "خطأ غير معروف"}",
                )
            }
        }
    }

    fun logout() {
        AuthTokenHolder.clear()
        securePrefs.edit().remove("admin_token").apply()
        _uiState.value = DeveloperUiState(isRestoringAuth = false)
    }

    fun loadSources() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val sources = api.listSources()
                _uiState.value = _uiState.value.copy(
                    sources = sources,
                    isLoading = false,
                    syncStatus = sources.firstOrNull()?.syncStatus ?: "idle",
                    lastSyncTime = sources.firstOrNull()?.lastSyncedAt,
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "فشل تحميل المصادر: ${e.message?.take(100) ?: "خطأ غير معروف"}",
                )
            }
        }
    }

    fun showAddDialog() {
        _uiState.value = _uiState.value.copy(showAddDialog = true, editingSource = null)
    }

    fun showEditDialog(source: Source) {
        _uiState.value = _uiState.value.copy(showAddDialog = true, editingSource = source)
    }

    fun hideDialog() {
        _uiState.value = _uiState.value.copy(showAddDialog = false, editingSource = null)
    }

    fun addSource(
        name: String,
        type: String,
        url: String,
        username: String?,
        password: String?,
    ) {
        viewModelScope.launch {
            try {
                val request = SourceCreateRequest(
                    name = name,
                    type = type,
                    url = url,
                    username = username,
                    password = password,
                )
                api.createSource(request)
                hideDialog()
                loadSources()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "فشل إضافة المصدر: ${e.message?.take(100) ?: "خطأ غير معروف"}",
                )
            }
        }
    }

    fun updateSource(
        id: Int,
        name: String,
        type: String,
        url: String,
        username: String?,
        password: String?,
    ) {
        viewModelScope.launch {
            try {
                val request = SourceUpdateRequest(
                    name = name,
                    type = type,
                    url = url,
                    username = username,
                    password = password,
                )
                api.updateSource(id, request)
                hideDialog()
                loadSources()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "فشل تحديث المصدر: ${e.message?.take(100) ?: "خطأ غير معروف"}",
                )
            }
        }
    }

    fun requestDelete(source: Source) {
        _uiState.value = _uiState.value.copy(showDeleteConfirm = source)
    }

    fun cancelDelete() {
        _uiState.value = _uiState.value.copy(showDeleteConfirm = null)
    }

    fun confirmDelete(id: Int) {
        viewModelScope.launch {
            try {
                api.deleteSource(id)
                _uiState.value = _uiState.value.copy(showDeleteConfirm = null)
                loadSources()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    showDeleteConfirm = null,
                    error = "فشل حذف المصدر: ${e.message?.take(100) ?: "خطأ غير معروف"}",
                )
            }
        }
    }

    fun forceSync(sourceId: Int) {
        viewModelScope.launch {
            try {
                api.syncSource(sourceId)
                loadSources()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "فشت مزامنة المصدر: ${e.message?.take(100) ?: "خطأ غير معروف"}",
                )
            }
        }
    }

    fun forceSyncAll() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSyncingAll = true, error = null)
            try {
                api.syncAll()
                loadSources()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isSyncingAll = false,
                    error = "فشلت المزامنة الكلية: ${e.message?.take(100) ?: "خطأ غير معروف"}",
                )
            }
        }
    }

    fun loadSyncHistory() {
        viewModelScope.launch {
            try {
                val history = api.getSyncHistory()
                _uiState.value = _uiState.value.copy(
                    syncHistory = history,
                    showSyncHistory = true,
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "فشل تحميل سجل المزامنة: ${e.message?.take(100) ?: "خطأ غير معروف"}",
                )
            }
        }
    }

    fun hideSyncHistory() {
        _uiState.value = _uiState.value.copy(showSyncHistory = false)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
