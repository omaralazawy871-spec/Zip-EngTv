package com.engtv.data.api

import com.engtv.data.models.AppSettings
import com.engtv.data.models.Category
import com.engtv.data.models.Channel
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Retrofit interface for the EngTv public API.
 *
 * The API base URL is read from BuildConfig.API_BASE_URL, which is
 * set in local.properties during the build — never hardcoded here.
 *
 * Stream URLs inside [Channel] responses also come from the server;
 * they are fetched on demand when the user taps a channel and passed
 * directly to ExoPlayer. They are never stored inside the APK.
 */
interface EngTvApi {

    // ── Settings ──────────────────────────────────────────────────────────

    @GET("settings")
    suspend fun getSettings(): AppSettings

    // ── Categories ────────────────────────────────────────────────────────

    /** Returns visible categories (no channels). */
    @GET("categories")
    suspend fun listCategories(): List<Category>

    /** Returns a single category with its channels list included. */
    @GET("categories/{id}")
    suspend fun getCategory(@Path("id") id: Int): Category

    // ── Channels ──────────────────────────────────────────────────────────

    /**
     * Returns channels with optional filters.
     * @param categoryId filter by category
     * @param query search query
     * @param activeOnly when true only active channels are returned (default on server: true)
     */
    @GET("channels")
    suspend fun listChannels(
        @Query("category_id") categoryId: Int? = null,
        @Query("q") query: String? = null,
        @Query("active_only") activeOnly: Boolean? = null,
    ): List<Channel>

    /** Returns a single channel. The [Channel.streamUrl] is used for playback. */
    @GET("channels/{id}")
    suspend fun getChannel(@Path("id") id: Int): Channel
}
