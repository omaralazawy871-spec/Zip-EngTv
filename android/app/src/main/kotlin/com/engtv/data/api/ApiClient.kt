package com.engtv.data.api

import com.engtv.BuildConfig
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

// ── Runtime API URL holder ────────────────────────────────────────────────────
/**
 * Singleton that holds the effective API base URL at runtime.
 *
 * Initialized from BuildConfig at startup; updated by [SettingsRepository.saveApiUrl]
 * when the user changes the server address in the Settings screen.
 * The [UrlRewriteInterceptor] reads this on every request, so changes take effect
 * immediately without restarting the app.
 */
object ApiConfigHolder {
    @Volatile
    var baseUrl: String = BuildConfig.API_BASE_URL
}

// ── Dynamic URL interceptor ───────────────────────────────────────────────────
/**
 * Rewrites the host/scheme/port of every outgoing request to match [ApiConfigHolder.baseUrl].
 *
 * This allows the user to change the API server address in Settings without reinstalling
 * or rebuilding the APK. The path, query, and body of the request are preserved.
 */
class UrlRewriteInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val configUrl = ApiConfigHolder.baseUrl
            .trimEnd('/')
            .toHttpUrlOrNull()
            ?: return chain.proceed(original)

        val newUrl = original.url
            .newBuilder()
            .scheme(configUrl.scheme)
            .host(configUrl.host)
            .port(configUrl.port)
            .build()

        return chain.proceed(original.newBuilder().url(newUrl).build())
    }
}

// ── ApiClient factory ─────────────────────────────────────────────────────────
object ApiClient {

    val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG)
            HttpLoggingInterceptor.Level.BODY
        else
            HttpLoggingInterceptor.Level.NONE
    }

    fun buildOkHttp(): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor(UrlRewriteInterceptor())   // dynamic base URL
            .addInterceptor(loggingInterceptor)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()

    /**
     * Build a Retrofit instance.
     * The [baseUrl] here is a placeholder; [UrlRewriteInterceptor] overrides it at runtime.
     * We still need a syntactically valid URL so Retrofit doesn't throw on construction.
     */
    fun buildRetrofit(okHttpClient: OkHttpClient, baseUrl: String): Retrofit =
        Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(
                json.asConverterFactory("application/json; charset=UTF-8".toMediaType())
            )
            .build()

    fun buildApi(retrofit: Retrofit): EngTvApi =
        retrofit.create(EngTvApi::class.java)
}
