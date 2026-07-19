package com.engtv.data.repository

import com.engtv.data.api.EngTvApi
import com.engtv.data.database.dao.ChannelDao
import com.engtv.data.database.dao.FavoriteDao
import com.engtv.data.database.dao.WatchHistoryDao
import com.engtv.data.database.entities.ChannelEntity
import com.engtv.data.database.entities.FavoriteEntity
import com.engtv.data.database.entities.WatchHistoryEntity
import com.engtv.data.models.Channel
import com.engtv.data.models.ServerChannel
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class ChannelRepositoryTest {

    private val api: EngTvApi = mockk()
    private val channelDao: ChannelDao = mockk()
    private val favoriteDao: FavoriteDao = mockk()
    private val watchHistoryDao: WatchHistoryDao = mockk()
    private lateinit var repository: ChannelRepository

    @Before
    fun setup() {
        repository = ChannelRepository(api, channelDao, favoriteDao, watchHistoryDao)
    }

    @Test
    fun `getChannel returns channel from API and caches locally`() = runTest {
        val serverChannel = ServerChannel(
            id = 1, name = "Test Channel", streamUrl = "https://example.com/stream",
            logoUrl = null, categoryId = null, isActive = true, sortOrder = 0,
        )

        coEvery { api.getChannel(1) } returns serverChannel
        coEvery { channelDao.upsert(any()) } returns Unit

        val result = repository.getChannel(1)

        assertTrue(result.isSuccess)
        assertEquals("Test Channel", result.getOrNull()?.name)
        coVerify { channelDao.upsert(any()) }
    }

    @Test
    fun `toggleFavorite adds when not favorited`() = runTest {
        coEvery { favoriteDao.getAllIds() } returns emptyList()
        coEvery { favoriteDao.insert(any()) } returns Unit

        repository.toggleFavorite(Channel(1, "Test", "", null, null, true, 0))

        coVerify { favoriteDao.insert(FavoriteEntity(channelId = 1)) }
    }

    @Test
    fun `toggleFavorite removes when already favorited`() = runTest {
        coEvery { favoriteDao.getAllIds() } returns listOf(1)
        coEvery { favoriteDao.deleteByChannelId(1) } returns Unit

        repository.toggleFavorite(Channel(1, "Test", "", null, null, true, 0))

        coVerify { favoriteDao.deleteByChannelId(1) }
    }

    @Test
    fun `recordWatch upserts watch history`() = runTest {
        coEvery { watchHistoryDao.upsert(any()) } returns Unit

        val channel = Channel(1, "Test", "", null, null, true, 0)
        repository.recordWatch(channel, 5000L)

        coVerify {
            watchHistoryDao.upsert(
                withArg { entity ->
                    assert(entity.channelId == 1)
                    assert(entity.positionMs == 5000L)
                }
            )
        }
    }

    @Test
    fun `refresh fetches channels from API and caches`() = runTest {
        val channels = listOf(
            ServerChannel(1, "Ch1", "url1", null, null, true, 0),
            ServerChannel(2, "Ch2", "url2", null, null, true, 0),
        )
        coEvery { api.listChannels(categoryId = null) } returns channels
        coEvery { channelDao.upsertAll(any()) } returns Unit

        val result = repository.refresh()

        assertTrue(result.isSuccess)
        assertEquals(2, result.getOrNull()?.size)
    }
}
