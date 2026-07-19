package com.engtv.player

import android.content.Context
import androidx.media3.common.C
import androidx.media3.common.Format
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.TrackSelectionOverride
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.hls.HlsMediaSource
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

data class DrmConfig(
    val schemeUuid: UUID = UUID.fromString("edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"),
    val licenseUrl: String,
    val headers: Map<String, String> = emptyMap(),
)

data class VideoTrackInfo(val groupIndex: Int, val trackIndex: Int, val format: Format) {
    val label: String get() {
        val height = format.height
        val bitrate = format.bitrate
        return when {
            height >= 2160 -> "4K"
            height >= 1440 -> "1440p"
            height >= 1080 -> "1080p"
            height >= 720 -> "720p"
            height >= 480 -> "480p"
            height >= 360 -> "360p"
            height >= 240 -> "240p"
            height >= 144 -> "144p"
            bitrate > 0 -> "${bitrate / 1000}kbps"
            else -> format.id ?: "Video ${trackIndex + 1}"
        }
    }
}

data class AudioTrackInfo(val groupIndex: Int, val trackIndex: Int, val format: Format) {
    val label: String get() = format.label?.takeIf { it.isNotBlank() }
        ?: format.language?.takeIf { it.isNotBlank() }
        ?: "Audio ${trackIndex + 1}"
    val language: String? get() = format.language
}

data class SubtitleTrackInfo(val groupIndex: Int, val trackIndex: Int, val format: Format) {
    val label: String get() = format.label?.takeIf { it.isNotBlank() }
        ?: format.language?.takeIf { it.isNotBlank() }
        ?: "Subtitle ${trackIndex + 1}"
    val language: String? get() = format.language
}

@Singleton
class PlayerManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private var lastStreamUrl: String? = null
    private var lastDrmConfig: DrmConfig? = null

    val player: ExoPlayer by lazy {
        ExoPlayer.Builder(context)
            .build()
            .apply {
                playWhenReady = true
                repeatMode = Player.REPEAT_MODE_OFF
            }
    }

    var availableVideoTracks: List<VideoTrackInfo> = emptyList()
        private set
    var availableAudioTracks: List<AudioTrackInfo> = emptyList()
        private set
    var availableSubtitleTracks: List<SubtitleTrackInfo> = emptyList()
        private set

    private val listeners = mutableListOf<Player.Listener>()

    private fun buildDataSourceFactory(): DefaultHttpDataSource.Factory =
        DefaultHttpDataSource.Factory()
            .setUserAgent("EngTv-Android/1.0")
            .setAllowCrossProtocolRedirects(true)
            .setConnectTimeoutMs(15_000)
            .setReadTimeoutMs(30_000)

    private fun buildMediaItem(streamUrl: String, drmConfig: DrmConfig? = null): MediaItem {
        val builder = MediaItem.Builder()
            .setUri(streamUrl)
        if (drmConfig != null) {
            builder.setDrmUuid(drmConfig.schemeUuid)
                .setDrmLicenseUri(drmConfig.licenseUrl)
                .setDrmMultiSession(false)
                .setDrmForceDefaultLicenseUri(false)
        }
        return builder.build()
    }

    fun play(streamUrl: String, drmConfig: DrmConfig? = null) {
        lastStreamUrl = streamUrl
        lastDrmConfig = drmConfig
        player.stop()
        player.clearMediaItems()

        val isHls = streamUrl.contains(".m3u8", ignoreCase = true)
            || streamUrl.contains("type=m3u8", ignoreCase = true)
            || streamUrl.contains("playlist.m3u", ignoreCase = true)

        val mediaItem = buildMediaItem(streamUrl, drmConfig)

        if (isHls) {
            val mediaSource = HlsMediaSource.Factory(buildDataSourceFactory())
                .createMediaSource(mediaItem)
            player.setMediaSource(mediaSource)
        } else {
            player.setMediaItem(mediaItem)
        }

        player.prepare()
        player.play()
    }

    fun retry() {
        val url = lastStreamUrl ?: return
        play(url, lastDrmConfig)
    }

    fun pause() = player.pause()
    fun resume() = player.play()
    fun stop() = player.stop()

    fun getCurrentPosition(): Long = player.currentPosition
    fun getDuration(): Long = player.duration

    fun saveState(): Long = player.currentPosition

    fun restoreState(positionMs: Long) {
        if (positionMs > 0) {
            player.seekTo(positionMs)
        }
    }

    fun setQuality(trackIndex: Int) {
        setTrackSelection(C.TRACK_TYPE_VIDEO, trackIndex)
    }

    fun setSubtitleTrack(trackIndex: Int) {
        setTrackSelection(C.TRACK_TYPE_TEXT, trackIndex)
    }

    fun setAudioTrack(trackIndex: Int) {
        setTrackSelection(C.TRACK_TYPE_AUDIO, trackIndex)
    }

    private fun setTrackSelection(type: Int, trackIndex: Int) {
        val currentTracks = player.currentTracks ?: return
        val groups = currentTracks.groups
        for (i in groups.indices) {
            if (groups[i].type == type) {
                val params = player.trackSelectionParameters
                    .buildUpon()
                    .clearOverridesOfType(type)
                if (trackIndex >= 0) {
                    params.addOverride(
                        TrackSelectionOverride(groups[i].mediaTrackGroup, trackIndex)
                    )
                }
                player.trackSelectionParameters = params.build()
                return
            }
        }
    }

    fun refreshTrackInfo() {
        val currentTracks = player.currentTracks ?: return
        val video = mutableListOf<VideoTrackInfo>()
        val audio = mutableListOf<AudioTrackInfo>()
        val subtitle = mutableListOf<SubtitleTrackInfo>()

        for (groupIndex in 0 until currentTracks.groups.size) {
            val group = currentTracks.groups[groupIndex]
            for (trackIndex in 0 until group.length) {
                val format = group.getTrackFormat(trackIndex)
                when (group.type) {
                    C.TRACK_TYPE_VIDEO -> video.add(VideoTrackInfo(groupIndex, trackIndex, format))
                    C.TRACK_TYPE_AUDIO -> audio.add(AudioTrackInfo(groupIndex, trackIndex, format))
                    C.TRACK_TYPE_TEXT -> subtitle.add(SubtitleTrackInfo(groupIndex, trackIndex, format))
                }
            }
        }

        availableVideoTracks = video
        availableAudioTracks = audio
        availableSubtitleTracks = subtitle
    }

    fun addListener(listener: Player.Listener) {
        listeners.add(listener)
        player.addListener(listener)
    }

    fun removeListener(listener: Player.Listener) {
        listeners.remove(listener)
        player.removeListener(listener)
    }

    fun release() {
        listeners.forEach { player.removeListener(it) }
        listeners.clear()
        if (player.isPlaying) player.stop()
        player.release()
    }
}
