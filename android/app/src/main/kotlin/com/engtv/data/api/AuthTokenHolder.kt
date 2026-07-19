package com.engtv.data.api

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.long

object AuthTokenHolder {
    @Volatile
    var token: String? = null

    @Volatile
    var onUnauthorized: (() -> Unit)? = null

    private var notifiedUnauthorized = false

    fun clear() {
        token = null
        notifiedUnauthorized = false
    }

    /**
     * Check whether the stored JWT is expired by decoding its payload.
     * Returns true if no token is stored or the exp claim is in the past.
     */
    fun isExpired(): Boolean {
        val t = token ?: return true
        try {
            val parts = t.split(".")
            if (parts.size != 3) return true
            val payload = String(java.util.Base64.getUrlDecoder().decode(parts[1]))
            val json = Json { ignoreUnknownKeys = true }
            val obj = json.decodeFromString<JsonObject>(payload)
            val exp = obj["exp"]?.let { json.decodeFromJsonElement<Long>(it) } ?: return false
            return System.currentTimeMillis() / 1000 >= exp
        } catch (_: Exception) {
            return false
        }
    }

    internal fun notifyUnauthorized() {
        if (notifiedUnauthorized) return
        notifiedUnauthorized = true
        clear()
        onUnauthorized?.invoke()
    }
}
