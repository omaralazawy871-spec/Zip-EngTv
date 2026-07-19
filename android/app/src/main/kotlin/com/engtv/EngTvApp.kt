package com.engtv

import android.app.Application
import android.content.SharedPreferences
import com.engtv.core.crash.CrashReporter
import com.engtv.data.api.ApiConfigHolder
import com.engtv.di.PREF_API_URL
import com.engtv.di.PREFS_NAME
import com.engtv.notification.NotificationHelper
import com.engtv.worker.SyncWorker
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

/**
 * Application class — entry point for Hilt DI.
 *
 * Responsibilities:
 *  1. Initialise [ApiConfigHolder.baseUrl] from SharedPreferences so that any
 *     URL the user saved in Settings is live before the first network call.
 *  2. Create notification channels for local notifications.
 *  3. Schedule periodic WorkManager sync.
 *  4. Install global uncaught exception handler.
 *  5. Hilt component initialisation (handled by @HiltAndroidApp).
 */
@HiltAndroidApp
class EngTvApp : Application() {

    @Inject lateinit var sharedPreferences: SharedPreferences
    @Inject lateinit var notificationHelper: NotificationHelper
    @Inject lateinit var crashReporter: CrashReporter

    override fun onCreate() {
        super.onCreate()

        // Install global uncaught exception handler for crash logging.
        // Uses CrashReporter abstraction — replace NoOpCrashReporter with
        // FirebaseCrashReporter in AppModule for production crash reporting.
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            crashReporter.logException(throwable)
            defaultHandler?.uncaughtException(thread, throwable)
        }

        // Restore user-saved API URL so the UrlRewriteInterceptor uses it immediately.
        // Falls back to the value baked in at build time (BuildConfig.API_BASE_URL)
        // if the user has never changed it.
        val savedUrl = sharedPreferences.getString(PREF_API_URL, null)
        if (!savedUrl.isNullOrBlank()) {
            ApiConfigHolder.baseUrl = savedUrl
        }

        // Create notification channels (safe to call multiple times)
        notificationHelper.createNotificationChannels()

        // Schedule periodic background sync
        SyncWorker.schedule(this)
    }
}
