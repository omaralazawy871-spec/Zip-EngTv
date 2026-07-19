package com.engtv.data.backup

import android.content.Context
import android.net.Uri
import com.engtv.data.database.AppDatabase
import com.engtv.data.database.entities.CategoryEntity
import com.engtv.data.database.entities.ChannelEntity
import com.engtv.data.database.entities.FavoriteEntity
import com.engtv.data.database.entities.WatchHistoryEntity
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.IOException
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BackupManager @Inject constructor(
    private val database: AppDatabase,
    @ApplicationContext private val context: Context,
) {
    @Serializable
    data class BackupData(
        val version: Int = 1,
        val exportedAt: String = "",
        val channels: List<ChannelEntity>,
        val categories: List<CategoryEntity>,
        val favorites: List<FavoriteEntity>,
        val watchHistory: List<WatchHistoryEntity>,
    )

    companion object {
        private const val CURRENT_VERSION = 1
    }

    /**
     * Export app data to a JSON backup file.
     *
     * @param uri target URI for the backup file
     * @param includeCredentials when true, includes sensitive data (source credentials);
     *        defaults to false to avoid accidental credential exposure
     */
    suspend fun exportBackup(uri: Uri, includeCredentials: Boolean = false): Result<Unit> = runCatching {
        val channels = database.channelDao().getAll()
        val categories = database.categoryDao().getAll()
        val favorites = database.favoriteDao().getAll()
        val watchHistory = database.watchHistoryDao().getAll()

        // Sanitize: strip stream URLs when not including credentials
        val sanitizedChannels = if (includeCredentials) channels
            else channels.map { it.copy(streamUrl = "***") }

        val backupData = BackupData(
            version = CURRENT_VERSION,
            exportedAt = Instant.now().toString(),
            channels = sanitizedChannels,
            categories = categories,
            favorites = favorites,
            watchHistory = watchHistory,
        )

        val json = Json { prettyPrint = true }
        val jsonString = json.encodeToString(backupData)

        context.contentResolver.openOutputStream(uri)?.use { outputStream ->
            outputStream.write(jsonString.toByteArray(Charsets.UTF_8))
        } ?: throw IOException("تعذر فتح ملف للكتابة")
    }

    suspend fun importBackup(uri: Uri): Result<Unit> = runCatching {
        val jsonString = context.contentResolver.openInputStream(uri)?.use { inputStream ->
            inputStream.bufferedReader(Charsets.UTF_8).readText()
        } ?: throw IOException("تعذر فتح ملف للقراءة")

        val json = Json { ignoreUnknownKeys = true }
        val backupData = json.decodeFromString<BackupData>(jsonString)

        validateBackup(backupData).getOrThrow()

        database.runInTransaction {
            database.favoriteDao().deleteAll()
            database.watchHistoryDao().clearAll()
            database.channelDao().deleteAll()
            database.categoryDao().deleteAll()

            database.categoryDao().upsertAll(backupData.categories)
            database.channelDao().upsertAll(backupData.channels)
            backupData.favorites.forEach { database.favoriteDao().insert(it) }
            backupData.watchHistory.forEach { database.watchHistoryDao().upsert(it) }
        }
    }

    private fun validateBackup(data: BackupData): Result<Unit> {
        if (data.version > CURRENT_VERSION) {
            return Result.failure(
                IllegalArgumentException("إصدار النسخة الاحتياطية غير مدعوم: ${data.version}"),
            )
        }
        return Result.success(Unit)
    }
}
