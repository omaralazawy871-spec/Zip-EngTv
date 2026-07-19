package com.engtv.data.database.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.engtv.data.models.Category
import kotlinx.serialization.Serializable

@Serializable
@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey val id: Int,
    val name: String,
    val icon: String?,
    @ColumnInfo(name = "sort_order") val sortOrder: Int,
    @ColumnInfo(name = "is_visible") val isVisible: Boolean,
    @ColumnInfo(name = "cached_at") val cachedAt: Long = System.currentTimeMillis(),
)

fun CategoryEntity.toModel() = Category(
    id = id,
    name = name,
    icon = icon,
    sortOrder = sortOrder,
    isVisible = isVisible,
)

fun Category.toEntity() = CategoryEntity(
    id = id,
    name = name,
    icon = icon,
    sortOrder = sortOrder,
    isVisible = isVisible,
)
