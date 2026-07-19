package com.engtv.data.repository

import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.PagingData
import androidx.paging.map
import com.engtv.data.api.EngTvApi
import com.engtv.data.database.dao.ChannelDao
import com.engtv.data.database.dao.FavoriteDao
import com.engtv.data.database.dao.WatchHistoryDao
import com.engtv.data.database.entities.FavoriteEntity
import com.engtv.data.database.entities.WatchHistoryEntity
import com.engtv.data.database.entities.toEntity
import com.engtv.data.database.entities.toModel
import com.engtv.data.models.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChannelRepository @Inject constructor(
    private val api: EngTvApi,
    private val channelDao: ChannelDao,
    private val favoriteDao: FavoriteDao,
    private val watchHistoryDao: WatchHistoryDao,
) {

    // ── Channel listing ───────────────────────────────────────────────────

    /** Observe cached channels; call [refresh] to pull from server. */
    fun observeChannels(): Flow<List<Channel>> =
        channelDao.observeAll().map { list -> list.map { it.toModel() } }

    /** Paged channels from local cache. */
    fun getPagedChannels(): Flow<PagingData<Channel>> =
        Pager(config = PagingConfig(pageSize = 20)) {
            channelDao.pagingSource()
        }.flow.map { pagingData ->
            pagingData.map { it.toModel() }
        }

    fun observeByCategory(categoryId: Int): Flow<List<Channel>> =
        channelDao.observeByCategory(categoryId).map { list -> list.map { it.toModel() } }

    fun search(query: String): Flow<List<Channel>> =
        channelDao.search(query).map { list -> list.map { it.toModel() } }

    /**
     * Fetch all channels from the server and cache locally.
     * Stream URLs always originate from the server — never from the APK.
     */
    suspend fun refresh(categoryId: Int? = null): Result<List<Channel>> = runCatching {
        val channels = api.listChannels(categoryId = categoryId)
        channelDao.upsertAll(channels.map { it.toEntity() })
        channels
    }

    /** Fetch a single channel by ID (always live from server for fresh stream URL). */
    suspend fun getChannel(id: Int): Result<Channel> = runCatching {
        val channel = api.getChannel(id)
        channelDao.upsert(channel.toEntity())
        channel
    }

    // ── Favorites ─────────────────────────────────────────────────────────

    fun observeIsFavorite(channelId: Int): Flow<Boolean> =
        favoriteDao.observeIsFavorite(channelId)

    suspend fun toggleFavorite(channel: Channel) {
        val ids = favoriteDao.getAllIds()
        if (channel.id in ids) {
            favoriteDao.deleteByChannelId(channel.id)
        } else {
            favoriteDao.insert(FavoriteEntity(channelId = channel.id))
        }
    }

    /** Returns favorite channels — fetches from server if needed to resolve IDs. */
    suspend fun getFavoriteChannels(): Result<List<Channel>> = runCatching {
        val favoriteIds = favoriteDao.getAllIds().toSet()
        if (favoriteIds.isEmpty()) return@runCatching emptyList()

        // Try cache first, fall back to API for missing entries
        val cached = favoriteIds.mapNotNull { channelDao.getById(it)?.toModel() }
        if (cached.size == favoriteIds.size) return@runCatching cached

        val fromApi = api.listChannels()
        channelDao.upsertAll(fromApi.map { it.toEntity() })
        fromApi.filter { it.id in favoriteIds }
    }

    // ── Watch history ─────────────────────────────────────────────────────

    fun observeWatchHistory(): Flow<List<WatchHistoryEntity>> =
        watchHistoryDao.observeRecent()

    suspend fun recordWatch(channel: Channel, positionMs: Long = 0L) {
        watchHistoryDao.upsert(
            WatchHistoryEntity(
                channelId = channel.id,
                channelName = channel.name,
                logoUrl = channel.logoUrl,
                positionMs = positionMs,
            )
        )
    }

    suspend fun getWatchPosition(channelId: Int): Long =
        watchHistoryDao.getByChannelId(channelId)?.positionMs ?: 0L
}
