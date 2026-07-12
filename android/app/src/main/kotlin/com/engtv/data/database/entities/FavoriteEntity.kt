package com.engtv.data.database.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

/** Stores only the channel ID — no IPTV stream URL is persisted here. */
@Entity(tableName = "favorites")
data class FavoriteEntity(
    @PrimaryKey @ColumnInfo(name = "channel_id") val channelId: Int,
    @ColumnInfo(name = "added_at") val addedAt: Long = System.currentTimeMillis(),
)
