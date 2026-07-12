package com.engtv.ui.player

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.engtv.data.models.Channel
import com.engtv.data.repository.ChannelRepository
import com.engtv.player.PlayerManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PlayerUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val channel: Channel? = null,
    val isFavorite: Boolean = false,
)

@HiltViewModel
class PlayerViewModel @Inject constructor(
    private val channelRepository: ChannelRepository,
    val playerManager: PlayerManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow(PlayerUiState())
    val uiState: StateFlow<PlayerUiState> = _uiState.asStateFlow()

    /**
     * Load a channel by ID.
     * Always fetches live from the server so the stream URL is fresh — never served from APK.
     */
    fun loadChannel(channelId: Int) {
        viewModelScope.launch {
            _uiState.value = PlayerUiState(isLoading = true)
            channelRepository.getChannel(channelId)
                .onSuccess { channel ->
                    _uiState.value = PlayerUiState(isLoading = false, channel = channel)
                    // Start playback — streamUrl originates from the API response
                    playerManager.play(channel.streamUrl)
                    channelRepository.recordWatch(channel)
                }
                .onFailure { error ->
                    _uiState.value = PlayerUiState(isLoading = false, error = error.message)
                }
        }
    }

    fun toggleFavorite() {
        val channel = _uiState.value.channel ?: return
        viewModelScope.launch {
            channelRepository.toggleFavorite(channel)
            _uiState.value = _uiState.value.copy(isFavorite = !_uiState.value.isFavorite)
        }
    }

    override fun onCleared() {
        super.onCleared()
        playerManager.stop()
    }
}
