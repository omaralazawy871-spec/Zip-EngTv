package com.engtv.data.database.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.engtv.data.models.Channel

/**
 * Room entity for caching channel data locally.
 *
 * Note: streamUrl is cached here for offline access but always originates
 * from the server API — it is never hardcoded in the application source.
 */
@Entity(tableName = "channels")
data class ChannelEntity(
    @PrimaryKey val id: Int,
    val name: String,
    @ColumnInfo(name = "stream_url") val streamUrl: String,
    @ColumnInfo(name = "logo_url") val logoUrl: String?,
    @ColumnInfo(name = "category_id") val categoryId: Int?,
    @ColumnInfo(name = "is_active") val isActive: Boolean,
    @ColumnInfo(name = "sort_order") val sortOrder: Int,
    @ColumnInfo(name = "cached_at") val cachedAt: Long = System.currentTimeMillis(),
)

fun ChannelEntity.toModel() = Channel(
    id = id,
    name = name,
    streamUrl = streamUrl,
    logoUrl = logoUrl,
    categoryId = categoryId,
    isActive = isActive,
    sortOrder = sortOrder,
)

fun Channel.toEntity() = ChannelEntity(
    id = id,
    name = name,
    streamUrl = streamUrl,
    logoUrl = logoUrl,
    categoryId = categoryId,
    isActive = isActive,
    sortOrder = sortOrder,
)
