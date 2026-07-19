package com.engtv.data.api

import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor : Interceptor {

    @Volatile
    var onUnauthorized: (() -> Unit)? = null

    override fun intercept(chain: Interceptor.Chain): Response {
        // If token is expired, skip the request and immediately notify
        if (AuthTokenHolder.isExpired()) {
            AuthTokenHolder.notifyUnauthorized()
            // Still let the request through — the server will return 401
            // which triggers notifyUnauthorized again (no-op due to mutex)
        }

        val token = AuthTokenHolder.token
        val request = if (token != null) {
            chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else {
            chain.request()
        }

        val response = chain.proceed(request)

        if (response.code == 401) {
            AuthTokenHolder.notifyUnauthorized()
        }

        return response
    }
}
