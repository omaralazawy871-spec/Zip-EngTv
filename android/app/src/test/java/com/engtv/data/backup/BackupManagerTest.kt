package com.engtv.data.backup

import android.content.ContentResolver
import android.net.Uri
import com.engtv.data.database.dao.CategoryDao
import com.engtv.data.database.dao.ChannelDao
import com.engtv.data.database.dao.FavoriteDao
import com.engtv.data.database.dao.WatchHistoryDao
import com.engtv.data.database.entities.CategoryEntity
import com.engtv.data.database.entities.ChannelEntity
import com.engtv.data.database.entities.FavoriteEntity
import com.engtv.data.database.entities.WatchHistoryEntity
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.io.ByteArrayOutputStream
import java.io.OutputStream

class BackupManagerTest {

    private val channelDao: ChannelDao = mockk()
    private val categoryDao: CategoryDao = mockk()
    private val favoriteDao: FavoriteDao = mockk()
    private val watchHistoryDao: WatchHistoryDao = mockk()
    private val contentResolver: ContentResolver = mockk()
    private val context: android.content.Context = mockk()
    private lateinit var backupManager: BackupManager

    @Before
    fun setup() {
        every { context.contentResolver } returns contentResolver
        backupManager = BackupManager(context, channelDao, categoryDao, favoriteDao, watchHistoryDao)
    }

    @Test
    fun `exportBackup writes valid JSON`() = runTest {
        coEvery { channelDao.getAll() } returns listOf(
            ChannelEntity(1, "Ch1", "url1", null, null, true, 0),
        )
        coEvery { categoryDao.getAll() } returns emptyList()
        coEvery { favoriteDao.getAll() } returns emptyList()
        coEvery { watchHistoryDao.getAll() } returns emptyList()

        val outputStream = ByteArrayOutputStream()
        every { contentResolver.openOutputStream(any<Uri>()) } returns outputStream

        val uri = mockk<Uri>()
        val result = backupManager.exportBackup(uri)

        assertTrue(result.isSuccess)
        val json = outputStream.toString()
        assertTrue(json.contains("Ch1"))
        assertTrue(json.contains("version"))
    }

    @Test
    fun `exportBackup excludes credentials by default`() = runTest {
        coEvery { channelDao.getAll() } returns listOf(
            ChannelEntity(1, "Ch1", "sensitive-url", null, null, true, 0),
        )
        coEvery { categoryDao.getAll() } returns emptyList()
        coEvery { favoriteDao.getAll() } returns emptyList()
        coEvery { watchHistoryDao.getAll() } returns emptyList()

        val outputStream = ByteArrayOutputStream()
        every { contentResolver.openOutputStream(any<Uri>()) } returns outputStream

        val uri = mockk<Uri>()
        val result = backupManager.exportBackup(uri)

        assertTrue(result.isSuccess)
        val json = outputStream.toString()
        assertTrue(json.contains("***"))
        assertFalse(json.contains("sensitive-url"))
    }

    @Test
    fun `exportBackup includes credentials when requested`() = runTest {
        coEvery { channelDao.getAll() } returns listOf(
            ChannelEntity(1, "Ch1", "sensitive-url", null, null, true, 0),
        )
        coEvery { categoryDao.getAll() } returns emptyList()
        coEvery { favoriteDao.getAll() } returns emptyList()
        coEvery { watchHistoryDao.getAll() } returns emptyList()

        val outputStream = ByteArrayOutputStream()
        every { contentResolver.openOutputStream(any<Uri>()) } returns outputStream

        val uri = mockk<Uri>()
        val result = backupManager.exportBackup(uri, includeCredentials = true)

        assertTrue(result.isSuccess)
        val json = outputStream.toString()
        assertTrue(json.contains("sensitive-url"))
        assertFalse(json.contains("***"))
    }
}
