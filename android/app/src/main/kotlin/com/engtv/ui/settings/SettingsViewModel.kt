package com.engtv.ui.settings

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.engtv.BuildConfig
import com.engtv.data.backup.BackupManager
import com.engtv.data.models.AppLanguage
import com.engtv.data.models.PlayerType
import com.engtv.data.models.ThemeMode
import com.engtv.data.repository.DeveloperRepository
import com.engtv.data.repository.SettingsRepository
import com.engtv.data.repository.UserPreferencesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val apiUrl: String = BuildConfig.API_BASE_URL,
    val appName: String = "EngTv",
    val isSaving: Boolean = false,
    val savedMessage: String? = null,
    val cacheError: String? = null,
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val language: AppLanguage = AppLanguage.ARABIC,
    val autoPlayLastChannel: Boolean = true,
    val rememberQuality: Boolean = false,
    val defaultPlayer: PlayerType = PlayerType.INTERNAL,
    val isDeveloperMode: Boolean = false,
    val developerJustActivated: Boolean = false,
    val backupMessage: String? = null,
    val backupError: String? = null,
    val isExporting: Boolean = false,
    val isImporting: Boolean = false,
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val userPreferencesRepository: UserPreferencesRepository,
    private val developerRepository: DeveloperRepository,
    private val backupManager: BackupManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            settingsRepository.apiBaseUrl.collect { url ->
                _uiState.value = _uiState.value.copy(apiUrl = url)
            }
        }
        viewModelScope.launch {
            settingsRepository.cachedSettings.collect { settings ->
                _uiState.value = _uiState.value.copy(appName = settings.appName)
            }
        }
        viewModelScope.launch {
            userPreferencesRepository.preferences.collect { prefs ->
                _uiState.value = _uiState.value.copy(
                    themeMode = prefs.themeMode,
                    language = prefs.language,
                    autoPlayLastChannel = prefs.autoPlayLastChannel,
                    rememberQuality = prefs.rememberQuality,
                    defaultPlayer = prefs.defaultPlayer,
                )
            }
        }
        viewModelScope.launch {
            developerRepository.isDeveloperMode.collect { isDev ->
                _uiState.value = _uiState.value.copy(isDeveloperMode = isDev)
            }
        }
    }

    fun onLogoTap() {
        val unlocked = developerRepository.registerTap()
        if (unlocked) {
            viewModelScope.launch {
                developerRepository.enableDeveloperMode()
                _uiState.value = _uiState.value.copy(developerJustActivated = true)
            }
        }
    }

    fun clearDeveloperJustActivated() {
        _uiState.value = _uiState.value.copy(developerJustActivated = false)
    }

    fun disableDeveloperMode() {
        viewModelScope.launch {
            developerRepository.disableDeveloperMode()
        }
    }

    fun onApiUrlChange(url: String) {
        _uiState.value = _uiState.value.copy(apiUrl = url, savedMessage = null, cacheError = null)
    }

    fun saveApiUrl() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, cacheError = null)
            settingsRepository.saveApiUrl(_uiState.value.apiUrl)
            val result = settingsRepository.fetchAndCache()
            result.onFailure { e ->
                _uiState.value = _uiState.value.copy(
                    isSaving = false,
                    cacheError = "فشل تحميل الإعدادات: ${e.message?.take(100) ?: "خطأ غير معروف"}",
                    savedMessage = null,
                )
                return@launch
            }
            _uiState.value = _uiState.value.copy(isSaving = false, savedMessage = "تم الحفظ ✓")
        }
    }

    fun setThemeMode(mode: ThemeMode) {
        viewModelScope.launch { userPreferencesRepository.setThemeMode(mode) }
    }

    fun setLanguage(language: AppLanguage) {
        viewModelScope.launch { userPreferencesRepository.setLanguage(language) }
    }

    fun setAutoPlayLast(enabled: Boolean) {
        viewModelScope.launch { userPreferencesRepository.setAutoPlayLast(enabled) }
    }

    fun setRememberQuality(enabled: Boolean) {
        viewModelScope.launch { userPreferencesRepository.setRememberQuality(enabled) }
    }

    fun setDefaultPlayer(player: PlayerType) {
        viewModelScope.launch { userPreferencesRepository.setDefaultPlayer(player) }
    }

    fun exportBackup(uri: Uri) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isExporting = true, backupMessage = null, backupError = null)
            val result = backupManager.exportBackup(uri)
            result.onSuccess {
                _uiState.value = _uiState.value.copy(
                    isExporting = false,
                    backupMessage = "تم تصدير النسخة الاحتياطية بنجاح",
                )
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(
                    isExporting = false,
                    backupError = "خطأ في التصدير: ${e.message?.take(100) ?: "غير معروف"}",
                )
            }
        }
    }

    fun importBackup(uri: Uri) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isImporting = true, backupMessage = null, backupError = null)
            val result = backupManager.importBackup(uri)
            result.onSuccess {
                _uiState.value = _uiState.value.copy(
                    isImporting = false,
                    backupMessage = "تم استيراد النسخة الاحتياطية بنجاح",
                )
            }.onFailure { e ->
                _uiState.value = _uiState.value.copy(
                    isImporting = false,
                    backupError = "خطأ في الاستيراد: ${e.message?.take(100) ?: "غير معروف"}",
                )
            }
        }
    }

    fun clearBackupMessages() {
        _uiState.value = _uiState.value.copy(backupMessage = null, backupError = null)
    }
}
