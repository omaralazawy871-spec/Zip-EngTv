package com.engtv.data.repository

import android.content.SharedPreferences
import androidx.core.content.edit
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.engtv.BuildConfig
import com.engtv.data.api.ApiConfigHolder
import com.engtv.data.api.EngTvApi
import com.engtv.data.models.AppSettings
import com.engtv.di.PREF_API_URL
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SettingsRepository @Inject constructor(
    private val api: EngTvApi,
    private val dataStore: DataStore<Preferences>,
    private val sharedPreferences: SharedPreferences,
) {

    companion object {
        private val KEY_APP_NAME   = stringPreferencesKey("app_name")
        private val KEY_LOGO_URL   = stringPreferencesKey("logo_url")
        private val KEY_FOOTER     = stringPreferencesKey("footer_text")
        val KEY_API_URL            = stringPreferencesKey(PREF_API_URL)
    }

    /** The effective API base URL as a reactive Flow (for UI observation). */
    val apiBaseUrl: Flow<String> = dataStore.data.map { prefs ->
        prefs[KEY_API_URL] ?: BuildConfig.API_BASE_URL
    }

    val cachedSettings: Flow<AppSettings> = dataStore.data.map { prefs ->
        AppSettings(
            appName    = prefs[KEY_APP_NAME] ?: "EngTv",
            appLogoUrl = prefs[KEY_LOGO_URL],
            footerText = prefs[KEY_FOOTER],
        )
    }

    suspend fun fetchAndCache(): Result<AppSettings> = runCatching {
        val settings = api.getSettings()
        dataStore.edit { prefs ->
            prefs[KEY_APP_NAME] = settings.appName
            settings.appLogoUrl?.let { prefs[KEY_LOGO_URL] = it }
            settings.footerText?.let { prefs[KEY_FOOTER] = it }
        }
        settings
    }

    /**
     * Persist a new API base URL.
     *
     * Writes to:
     *  - [ApiConfigHolder] → takes effect immediately for all new requests
     *  - SharedPreferences → survives process death; read in [EngTvApp.onCreate]
     *  - DataStore → drives the reactive [apiBaseUrl] Flow in the Settings screen
     */
    suspend fun saveApiUrl(url: String) {
        val normalized = url.trimEnd('/') + "/"
        ApiConfigHolder.baseUrl = normalized
        sharedPreferences.edit { putString(PREF_API_URL, normalized) }
        dataStore.edit { prefs -> prefs[KEY_API_URL] = normalized }
    }
}
