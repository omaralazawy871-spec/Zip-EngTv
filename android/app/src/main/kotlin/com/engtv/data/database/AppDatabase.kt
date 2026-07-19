package com.engtv.data.database

import androidx.room.Database
import androidx.room.Migration
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
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
    version = 2,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun channelDao(): ChannelDao
    abstract fun categoryDao(): CategoryDao
    abstract fun favoriteDao(): FavoriteDao
    abstract fun watchHistoryDao(): WatchHistoryDao

    companion object {
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE channels ADD COLUMN is_healthy INTEGER NOT NULL DEFAULT 1")
                db.execSQL("ALTER TABLE channels ADD COLUMN health_error TEXT")
                db.execSQL("ALTER TABLE channels ADD COLUMN last_checked_at TEXT")
            }
        }
    }
}
