package com.engtv

import android.app.Application
import android.content.SharedPreferences
import com.engtv.data.api.ApiConfigHolder
import com.engtv.di.PREF_API_URL
import com.engtv.di.PREFS_NAME
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

/**
 * Application class — entry point for Hilt DI.
 *
 * Responsibilities:
 *  1. Initialise [ApiConfigHolder.baseUrl] from SharedPreferences so that any
 *     URL the user saved in Settings is live before the first network call.
 *  2. Hilt component initialisation (handled by @HiltAndroidApp).
 */
@HiltAndroidApp
class EngTvApp : Application() {

    @Inject lateinit var sharedPreferences: SharedPreferences

    override fun onCreate() {
        super.onCreate()

        // Restore user-saved API URL so the UrlRewriteInterceptor uses it immediately.
        // Falls back to the value baked in at build time (BuildConfig.API_BASE_URL)
        // if the user has never changed it.
        val savedUrl = sharedPreferences.getString(PREF_API_URL, null)
        if (!savedUrl.isNullOrBlank()) {
            ApiConfigHolder.baseUrl = savedUrl
        }
    }
}
