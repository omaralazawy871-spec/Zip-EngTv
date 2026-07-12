package com.engtv.di

import android.content.Context
import android.content.SharedPreferences
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.Room
import com.engtv.BuildConfig
import com.engtv.data.api.ApiClient
import com.engtv.data.api.ApiConfigHolder
import com.engtv.data.api.EngTvApi
import com.engtv.data.database.AppDatabase
import com.engtv.data.database.dao.CategoryDao
import com.engtv.data.database.dao.ChannelDao
import com.engtv.data.database.dao.FavoriteDao
import com.engtv.data.database.dao.WatchHistoryDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "engtv_prefs")

const val PREFS_NAME = "engtv_config"
const val PREF_API_URL = "api_base_url"

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideSharedPreferences(@ApplicationContext context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    /**
     * OkHttpClient with the [UrlRewriteInterceptor] already attached.
     * The interceptor reads [ApiConfigHolder.baseUrl] on every request, so the URL
     * can be changed at runtime without rebuilding Retrofit.
     */
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient = ApiClient.buildOkHttp()

    /**
     * Retrofit built with a placeholder base URL.
     * Actual routing is handled by [UrlRewriteInterceptor] in OkHttp.
     */
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit =
        ApiClient.buildRetrofit(okHttpClient, BuildConfig.API_BASE_URL)

    @Provides
    @Singleton
    fun provideEngTvApi(retrofit: Retrofit): EngTvApi = ApiClient.buildApi(retrofit)

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, "engtv.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides fun provideChannelDao(db: AppDatabase): ChannelDao = db.channelDao()
    @Provides fun provideCategoryDao(db: AppDatabase): CategoryDao = db.categoryDao()
    @Provides fun provideFavoriteDao(db: AppDatabase): FavoriteDao = db.favoriteDao()
    @Provides fun provideWatchHistoryDao(db: AppDatabase): WatchHistoryDao = db.watchHistoryDao()

    @Provides
    @Singleton
    fun provideDataStore(@ApplicationContext context: Context): DataStore<Preferences> =
        context.dataStore
}
