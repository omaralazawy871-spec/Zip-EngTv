package com.engtv.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.engtv.BuildConfig
import com.engtv.data.repository.SettingsRepository
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
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
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
    }

    fun onApiUrlChange(url: String) {
        _uiState.value = _uiState.value.copy(apiUrl = url, savedMessage = null)
    }

    fun saveApiUrl() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true)
            settingsRepository.saveApiUrl(_uiState.value.apiUrl)
            settingsRepository.fetchAndCache()
            _uiState.value = _uiState.value.copy(isSaving = false, savedMessage = "تم الحفظ ✓")
        }
    }
}
