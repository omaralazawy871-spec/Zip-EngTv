package com.engtv.player

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.hls.HlsMediaSource
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Wraps ExoPlayer and wires up HLS + direct-stream playback.
 *
 * Stream URLs are passed in at playback time from [com.engtv.data.models.Channel.streamUrl],
 * which always comes from the API response — never stored inside the APK source code.
 *
 * Supported stream types (auto-detected by URL pattern):
 *  - HLS (.m3u8)        → [HlsMediaSource] for adaptive bit-rate streaming
 *  - Everything else    → Direct [MediaItem] (RTSP, RTMP via extension, MP4, TS, etc.)
 */
@Singleton
class PlayerManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {

    val player: ExoPlayer by lazy {
        ExoPlayer.Builder(context)
            .build()
            .apply {
                playWhenReady = true
                repeatMode = Player.REPEAT_MODE_OFF
            }
    }

    private fun buildDataSourceFactory(): DefaultHttpDataSource.Factory =
        DefaultHttpDataSource.Factory()
            .setUserAgent("EngTv-Android/1.0")
            .setAllowCrossProtocolRedirects(true)
            .setConnectTimeoutMs(15_000)
            .setReadTimeoutMs(30_000)

    /**
     * Begin playback of [streamUrl].
     *
     * HLS streams are detected by the .m3u8 extension or an explicit query param.
     * All other URLs fall back to a generic MediaItem so ExoPlayer can auto-detect
     * the container format (MPEG-TS, MP4, etc.).
     */
    fun play(streamUrl: String) {
        player.stop()
        player.clearMediaItems()

        val isHls = streamUrl.contains(".m3u8", ignoreCase = true)
            || streamUrl.contains("type=m3u8", ignoreCase = true)
            || streamUrl.contains("playlist.m3u", ignoreCase = true)

        if (isHls) {
            val mediaSource = HlsMediaSource.Factory(buildDataSourceFactory())
                .createMediaSource(MediaItem.fromUri(streamUrl))
            player.setMediaSource(mediaSource)
        } else {
            // For RTMP, direct TS, or any format ExoPlayer supports via auto-detection
            player.setMediaItem(MediaItem.fromUri(streamUrl))
        }

        player.prepare()
        player.play()
    }

    fun pause()  = player.pause()
    fun resume() = player.play()
    fun stop()   = player.stop()

    fun release() {
        if (player.isPlaying) player.stop()
        player.release()
    }
}
