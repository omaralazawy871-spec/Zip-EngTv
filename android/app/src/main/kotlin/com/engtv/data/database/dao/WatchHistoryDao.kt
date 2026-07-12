package com.engtv.data.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.engtv.data.database.entities.WatchHistoryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface WatchHistoryDao {

    @Query("SELECT * FROM watch_history ORDER BY last_watched_at DESC LIMIT 20")
    fun observeRecent(): Flow<List<WatchHistoryEntity>>

    @Query("SELECT * FROM watch_history WHERE channel_id = :channelId")
    suspend fun getByChannelId(channelId: Int): WatchHistoryEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entry: WatchHistoryEntity)

    @Query("DELETE FROM watch_history WHERE channel_id = :channelId")
    suspend fun deleteByChannelId(channelId: Int)

    @Query("DELETE FROM watch_history")
    suspend fun clearAll()
}
