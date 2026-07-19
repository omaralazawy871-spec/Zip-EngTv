package com.engtv.data.database.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

/** Tracks which channel was last watched and at what playback position. */
@Serializable
@Entity(tableName = "watch_history")
data class WatchHistoryEntity(
    @PrimaryKey @ColumnInfo(name = "channel_id") val channelId: Int,
    @ColumnInfo(name = "channel_name") val channelName: String,
    @ColumnInfo(name = "logo_url") val logoUrl: String?,
    /** Playback position in milliseconds, 0 for live streams. */
    @ColumnInfo(name = "position_ms") val positionMs: Long = 0L,
    @ColumnInfo(name = "last_watched_at") val lastWatchedAt: Long = System.currentTimeMillis(),
)
