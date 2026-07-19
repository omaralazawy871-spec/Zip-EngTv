package com.engtv.data.repository

import android.content.SharedPreferences
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.engtv.data.models.AppLanguage
import com.engtv.data.models.PlayerType
import com.engtv.data.models.ThemeMode
import com.engtv.data.models.UserPreferences
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Named
import javax.inject.Singleton

@Singleton
class UserPreferencesRepository @Inject constructor(
    @Named("userPreferences") private val dataStore: DataStore<Preferences>,
    @Named("encrypted") private val securePrefs: SharedPreferences,
) {

    private object PreferenceKeys {
        val THEME_MODE = stringPreferencesKey("theme_mode")
        val LANGUAGE = stringPreferencesKey("language")
        val AUTO_PLAY_LAST = booleanPreferencesKey("auto_play_last")
        val REMEMBER_QUALITY = booleanPreferencesKey("remember_quality")
        val DEFAULT_PLAYER = stringPreferencesKey("default_player")
    }

    val preferences: Flow<UserPreferences> = dataStore.data.map { prefs ->
        UserPreferences(
            themeMode = try {
                ThemeMode.valueOf(prefs[PreferenceKeys.THEME_MODE] ?: ThemeMode.SYSTEM.name)
            } catch (_: IllegalArgumentException) { ThemeMode.SYSTEM },
            language = try {
                AppLanguage.valueOf(prefs[PreferenceKeys.LANGUAGE] ?: AppLanguage.ARABIC.name)
            } catch (_: IllegalArgumentException) { AppLanguage.ARABIC },
            autoPlayLastChannel = prefs[PreferenceKeys.AUTO_PLAY_LAST] ?: true,
            rememberQuality = prefs[PreferenceKeys.REMEMBER_QUALITY] ?: false,
            defaultPlayer = try {
                PlayerType.valueOf(prefs[PreferenceKeys.DEFAULT_PLAYER] ?: PlayerType.INTERNAL.name)
            } catch (_: IllegalArgumentException) { PlayerType.INTERNAL },
        )
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        dataStore.edit { prefs -> prefs[PreferenceKeys.THEME_MODE] = mode.name }
    }

    suspend fun setLanguage(language: AppLanguage) {
        dataStore.edit { prefs -> prefs[PreferenceKeys.LANGUAGE] = language.name }
    }

    suspend fun setAutoPlayLast(enabled: Boolean) {
        dataStore.edit { prefs -> prefs[PreferenceKeys.AUTO_PLAY_LAST] = enabled }
    }

    suspend fun setRememberQuality(enabled: Boolean) {
        dataStore.edit { prefs -> prefs[PreferenceKeys.REMEMBER_QUALITY] = enabled }
    }

    suspend fun setDefaultPlayer(player: PlayerType) {
        dataStore.edit { prefs -> prefs[PreferenceKeys.DEFAULT_PLAYER] = player.name }
    }

    fun getSecurePrefs(): SharedPreferences = securePrefs
}
