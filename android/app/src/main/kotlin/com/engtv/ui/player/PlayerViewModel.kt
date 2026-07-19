package com.engtv.ui.player

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.media3.common.Player
import androidx.media3.common.PlaybackException
import com.engtv.data.models.Channel
import com.engtv.data.repository.ChannelRepository
import com.engtv.player.PlayerManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject

data class QualityOption(val index: Int, val label: String, val height: Int)
data class SubtitleOption(val index: Int, val label: String, val language: String?)
data class AudioOption(val index: Int, val label: String, val language: String?)

private const val BUFFER_TIMEOUT_MS = 15_000L
private const val MAX_RETRIES = 3

data class PlayerUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val channel: Channel? = null,
    val isFavorite: Boolean = false,
    val isPlaying: Boolean = false,
    val isBuffering: Boolean = false,
    val isRecovering: Boolean = false,
    val retryCount: Int = 0,
    val currentPosition: Long = 0L,
    val duration: Long = 0L,
    val availableQualities: List<QualityOption> = emptyList(),
    val selectedQualityIndex: Int = -1,
    val subtitleTracks: List<SubtitleOption> = emptyList(),
    val selectedSubtitleIndex: Int = -1,
    val audioTracks: List<AudioOption> = emptyList(),
    val selectedAudioIndex: Int = 0,
    val relatedChannels: List<Channel> = emptyList(),
    val channelCategory: String? = null,
    val showQualitySelector: Boolean = false,
    val showSubtitleSelector: Boolean = false,
    val showAudioSelector: Boolean = false,
)

@HiltViewModel
class PlayerViewModel @Inject constructor(
    private val channelRepository: ChannelRepository,
    val playerManager: PlayerManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow(PlayerUiState())
    val uiState: StateFlow<PlayerUiState> = _uiState.asStateFlow()

    private var positionUpdateJob: Job? = null

    private var bufferingTimeoutJob: Job? = null

    private val playerListener = object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
            val isBuffering = playbackState == Player.STATE_BUFFERING
            val isPlaying = playbackState == Player.STATE_READY && playerManager.player.playWhenReady

            when (playbackState) {
                Player.STATE_BUFFERING -> startBufferingTimeout()
                Player.STATE_READY -> {
                    refreshTracks()
                    startPositionUpdates()
                    cancelBufferingTimeout()
                    _uiState.value = _uiState.value.copy(retryCount = 0, isRecovering = false)
                }
                Player.STATE_ENDED -> {
                    _uiState.value = _uiState.value.copy(
                        isPlaying = false, error = "انتهى البث"
                    )
                }
            }

            _uiState.value = _uiState.value.copy(
                isPlaying = isPlaying,
                isBuffering = isBuffering,
            )
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
            _uiState.value = _uiState.value.copy(isPlaying = isPlaying)
            if (isPlaying) {
                startPositionUpdates()
                cancelBufferingTimeout()
            } else {
                stopPositionUpdates()
            }
        }

        override fun onTracksChanged(tracks: Player.Tracks) {
            refreshTracks()
        }

        override fun onPlayerError(error: PlaybackException) {
            val currentRetryCount = _uiState.value.retryCount
            if (currentRetryCount < MAX_RETRIES) {
                _uiState.value = _uiState.value.copy(
                    isRecovering = true,
                    retryCount = currentRetryCount + 1,
                )
                viewModelScope.launch {
                    delay((1000L shl currentRetryCount).coerceAtMost(8_000L))
                    playerManager.retry()
                }
            } else {
                _uiState.value = _uiState.value.copy(
                    isRecovering = false,
                    error = "تعذر تشغيل البث: ${error.localizedMessage?.take(100) ?: "خطأ غير معروف"}",
                )
            }
        }
    }

    fun loadChannel(channelId: Int) {
        viewModelScope.launch {
            _uiState.value = PlayerUiState(isLoading = true)
            channelRepository.getChannel(channelId)
                .onSuccess { channel ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        channel = channel,
                    )
                    playerManager.addListener(playerListener)
                    playerManager.play(channel.streamUrl)
                    channelRepository.recordWatch(channel)
                    checkFavorite(channelId)
                    loadRelatedChannels(channel.categoryId)
                    restorePlaybackPosition(channel.id)
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message ?: "خطأ في تحميل القناة",
                    )
                }
        }
    }

    private suspend fun checkFavorite(channelId: Int) {
        channelRepository.observeIsFavorite(channelId).collect { isFav ->
            _uiState.value = _uiState.value.copy(isFavorite = isFav)
        }
    }

    private suspend fun loadRelatedChannels(categoryId: Int?) {
        if (categoryId == null) return
        val currentChannel = _uiState.value.channel ?: return
        channelRepository.observeByCategory(categoryId).collect { channels ->
            val related = channels.filter { it.id != currentChannel.id }
            _uiState.value = _uiState.value.copy(relatedChannels = related)
        }
    }

    private fun refreshTracks() {
        playerManager.refreshTrackInfo()
        _uiState.value = _uiState.value.copy(
            availableQualities = listOf(QualityOption(-1, "تلقائي", 0)) +
                playerManager.availableVideoTracks.map { track ->
                    QualityOption(track.trackIndex, track.label, track.format.height)
                },
            selectedQualityIndex = _uiState.value.selectedQualityIndex,
            subtitleTracks = listOf(SubtitleOption(-1, "إيقاف", null)) +
                playerManager.availableSubtitleTracks.map { track ->
                    SubtitleOption(track.trackIndex, track.label, track.language)
                },
            selectedSubtitleIndex = if (_uiState.value.selectedSubtitleIndex < 0) -1
                else _uiState.value.selectedSubtitleIndex,
            audioTracks = playerManager.availableAudioTracks.mapIndexed { index, track ->
                AudioOption(track.trackIndex, track.label, track.language)
            },
            selectedAudioIndex = _uiState.value.selectedAudioIndex,
        )
    }

    private fun startPositionUpdates() {
        positionUpdateJob?.cancel()
        positionUpdateJob = viewModelScope.launch {
            while (isActive) {
                _uiState.value = _uiState.value.copy(
                    currentPosition = playerManager.getCurrentPosition(),
                    duration = playerManager.getDuration(),
                )
                delay(250)
            }
        }
    }

    private fun stopPositionUpdates() {
        positionUpdateJob?.cancel()
        positionUpdateJob = null
    }

    fun togglePlayPause() {
        val player = playerManager.player
        if (player.isPlaying) {
            playerManager.pause()
            savePlaybackPosition()
        } else {
            playerManager.resume()
        }
        _uiState.value = _uiState.value.copy(isPlaying = player.isPlaying)
    }

    fun seekTo(positionMs: Long) {
        playerManager.player.seekTo(positionMs)
        _uiState.value = _uiState.value.copy(currentPosition = positionMs)
    }

    fun selectQuality(index: Int) {
        _uiState.value = _uiState.value.copy(
            selectedQualityIndex = index,
            showQualitySelector = false,
        )
        playerManager.setQuality(index)
    }

    fun selectSubtitle(index: Int) {
        _uiState.value = _uiState.value.copy(
            selectedSubtitleIndex = index,
            showSubtitleSelector = false,
        )
        playerManager.setSubtitleTrack(index)
    }

    fun selectAudio(index: Int) {
        _uiState.value = _uiState.value.copy(
            selectedAudioIndex = index,
            showAudioSelector = false,
        )
        playerManager.setAudioTrack(index)
    }

    fun toggleQualitySelector() {
        _uiState.value = _uiState.value.copy(
            showQualitySelector = !_uiState.value.showQualitySelector,
            showSubtitleSelector = false,
            showAudioSelector = false,
        )
    }

    fun toggleSubtitleSelector() {
        _uiState.value = _uiState.value.copy(
            showSubtitleSelector = !_uiState.value.showSubtitleSelector,
            showQualitySelector = false,
            showAudioSelector = false,
        )
    }

    fun toggleAudioSelector() {
        _uiState.value = _uiState.value.copy(
            showAudioSelector = !_uiState.value.showAudioSelector,
            showQualitySelector = false,
            showSubtitleSelector = false,
        )
    }

    fun toggleFavorite() {
        val channel = _uiState.value.channel ?: return
        viewModelScope.launch {
            channelRepository.toggleFavorite(channel)
        }
    }

    fun openInExternalPlayer(context: Context) {
        val channel = _uiState.value.channel ?: return
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse(channel.streamUrl)
            type = "video/*"
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(Intent.createChooser(intent, "فتح بواسطة"))
    }

    fun retry() {
        _uiState.value = _uiState.value.copy(
            error = null, isLoading = true, retryCount = 0, isRecovering = false,
        )
        playerManager.retry()
        viewModelScope.launch {
            delay(500)
            _uiState.value = _uiState.value.copy(isLoading = false)
        }
    }

    private fun startBufferingTimeout() {
        cancelBufferingTimeout()
        bufferingTimeoutJob = viewModelScope.launch {
            delay(BUFFER_TIMEOUT_MS)
            val state = _uiState.value
            if (state.isBuffering && !state.isPlaying) {
                val currentRetry = state.retryCount
                if (currentRetry < MAX_RETRIES) {
                    _uiState.value = _uiState.value.copy(
                        retryCount = currentRetry + 1,
                    )
                    playerManager.retry()
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = "تعذر التحميل — يرجى التحقق من اتصالك بالإنترنت",
                        isBuffering = false,
                    )
                }
            }
        }
    }

    private fun cancelBufferingTimeout() {
        bufferingTimeoutJob?.cancel()
        bufferingTimeoutJob = null
    }

    fun savePlaybackPosition() {
        val channel = _uiState.value.channel ?: return
        val position = _uiState.value.currentPosition
        if (position > 5_000) {
            viewModelScope.launch {
                channelRepository.recordWatch(channel, position)
            }
        }
    }

    private fun restorePlaybackPosition(channelId: Int) {
        viewModelScope.launch {
            val saved = channelRepository.getWatchPosition(channelId)
            if (saved > 0) {
                playerManager.restoreState(saved)
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        savePlaybackPosition()
        cancelBufferingTimeout()
        stopPositionUpdates()
        playerManager.removeListener(playerListener)
        playerManager.stop()
    }
}
