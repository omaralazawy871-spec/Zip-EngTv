package com.engtv.data.repository

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DeveloperRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) {
    companion object {
        private val KEY_DEV_MODE = booleanPreferencesKey("developer_mode")
        private const val TAP_THRESHOLD_MS = 3000L
        private const val TAPS_REQUIRED = 7
    }

    private val tapTimestamps = mutableListOf<Long>()

    val isDeveloperMode: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[KEY_DEV_MODE] ?: false
    }

    fun registerTap(): Boolean {
        val now = System.currentTimeMillis()
        tapTimestamps.add(now)
        tapTimestamps.removeAll { now - it > TAP_THRESHOLD_MS }
        return tapTimestamps.size >= TAPS_REQUIRED
    }

    suspend fun enableDeveloperMode() {
        dataStore.edit { prefs -> prefs[KEY_DEV_MODE] = true }
    }

    suspend fun disableDeveloperMode() {
        dataStore.edit { prefs -> prefs[KEY_DEV_MODE] = false }
    }
}
