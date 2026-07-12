package com.engtv.ui.favorites

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.engtv.data.models.Channel
import com.engtv.data.repository.ChannelRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FavoritesUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val channels: List<Channel> = emptyList(),
)

@HiltViewModel
class FavoritesViewModel @Inject constructor(
    private val channelRepository: ChannelRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(FavoritesUiState())
    val uiState: StateFlow<FavoritesUiState> = _uiState.asStateFlow()

    init { loadFavorites() }

    fun loadFavorites() {
        viewModelScope.launch {
            _uiState.value = FavoritesUiState(isLoading = true)
            channelRepository.getFavoriteChannels()
                .onSuccess { channels ->
                    _uiState.value = FavoritesUiState(isLoading = false, channels = channels)
                }
                .onFailure { error ->
                    _uiState.value = FavoritesUiState(isLoading = false, error = error.message)
                }
        }
    }
}
