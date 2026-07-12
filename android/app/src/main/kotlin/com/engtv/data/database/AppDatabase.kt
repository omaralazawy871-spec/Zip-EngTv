package com.engtv.data.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.engtv.data.database.dao.CategoryDao
import com.engtv.data.database.dao.ChannelDao
import com.engtv.data.database.dao.FavoriteDao
import com.engtv.data.database.dao.WatchHistoryDao
import com.engtv.data.database.entities.CategoryEntity
import com.engtv.data.database.entities.ChannelEntity
import com.engtv.data.database.entities.FavoriteEntity
import com.engtv.data.database.entities.WatchHistoryEntity

@Database(
    entities = [
        ChannelEntity::class,
        CategoryEntity::class,
        FavoriteEntity::class,
        WatchHistoryEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun channelDao(): ChannelDao
    abstract fun categoryDao(): CategoryDao
    abstract fun favoriteDao(): FavoriteDao
    abstract fun watchHistoryDao(): WatchHistoryDao
}
