package com.engtv.player

import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

/**
 * Foreground service that exposes a [MediaSession] so the OS media controls
 * (lock-screen, notification, headset buttons) interact with ExoPlayer.
 *
 * Declared in AndroidManifest.xml with:
 *   android:foregroundServiceType="mediaPlayback"
 *   FOREGROUND_SERVICE + FOREGROUND_SERVICE_MEDIA_PLAYBACK permissions
 *
 * Hilt injects [PlayerManager] which owns the singleton [ExoPlayer] instance.
 * The service does NOT own or release the player — [PlayerManager] does.
 */
@AndroidEntryPoint
class EngTvPlaybackService : MediaSessionService() {

    @Inject lateinit var playerManager: PlayerManager

    private var mediaSession: MediaSession? = null

    override fun onCreate() {
        super.onCreate()
        mediaSession = MediaSession.Builder(this, playerManager.player).build()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? =
        mediaSession

    override fun onDestroy() {
        // Release the MediaSession wrapper only — the ExoPlayer instance is owned
        // by PlayerManager (singleton) and may still be needed after this service stops.
        mediaSession?.release()
        mediaSession = null
        super.onDestroy()
    }
}
