package com.engtv.notification

import android.app.NotificationChannel
import android.app.NotificationChannelGroup
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.engtv.MainActivity
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationHelper @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    companion object {
        const val CHANNEL_SYNC = "engtv_sync"
        const val CHANNEL_SOURCE = "engtv_source"
        const val CHANNEL_CHANNELS = "engtv_channels"

        private const val GROUP_SYNC = "engtv_sync_group"
        private const val GROUP_SOURCE = "engtv_source_group"
        private const val GROUP_CHANNELS = "engtv_channels_group"

        private const val NOTIFICATION_ID_SYNC_COMPLETED = 1001
        private const val NOTIFICATION_ID_SYNC_FAILED = 1002
        private const val NOTIFICATION_ID_SOURCE_UNAVAILABLE = 2001
        private const val NOTIFICATION_ID_NEW_CHANNELS = 3001
    }

    fun createNotificationChannels() {
        val groups = listOf(
            NotificationChannelGroup(GROUP_SYNC, "مزامنة IPTV"),
            NotificationChannelGroup(GROUP_SOURCE, "حالة المصادر"),
            NotificationChannelGroup(GROUP_CHANNELS, "القنوات"),
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            groups.forEach { notificationManager.createNotificationChannelGroup(it) }

            val channels = listOf(
                NotificationChannel(
                    CHANNEL_SYNC,
                    "مزامنة IPTV",
                    NotificationManager.IMPORTANCE_DEFAULT,
                ).apply {
                    description = "إشعارات حالة المزامنة مع الخادم"
                    group = GROUP_SYNC
                },
                NotificationChannel(
                    CHANNEL_SOURCE,
                    "حالة المصادر",
                    NotificationManager.IMPORTANCE_HIGH,
                ).apply {
                    description = "إشعارات حالة توفر مصادر البث"
                    group = GROUP_SOURCE
                },
                NotificationChannel(
                    CHANNEL_CHANNELS,
                    "القنوات",
                    NotificationManager.IMPORTANCE_DEFAULT,
                ).apply {
                    description = "إشعارات القنوات الجديدة المضافة"
                    group = GROUP_CHANNELS
                },
            )
            channels.forEach { notificationManager.createNotificationChannel(it) }
        }
    }

    private fun createIntent(): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        return PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    fun showSyncCompleted(count: Int) {
        val notification = NotificationCompat.Builder(context, CHANNEL_SYNC)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("تمت المزامنة")
            .setContentText("تم تحديث $count قناة")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(createIntent())
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(context).notify(
            NOTIFICATION_ID_SYNC_COMPLETED,
            notification,
        )
    }

    fun showSyncFailed(error: String) {
        val notification = NotificationCompat.Builder(context, CHANNEL_SYNC)
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setContentTitle("فشلت المزامنة")
            .setContentText(error)
            .setStyle(NotificationCompat.BigTextStyle().bigText(error))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(createIntent())
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID_SYNC_FAILED, notification)
    }

    fun showSourceUnavailable(sourceName: String) {
        val notification = NotificationCompat.Builder(context, CHANNEL_SOURCE)
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setContentTitle("مصدر غير متاح")
            .setContentText("المصدر $sourceName غير متاح حالياً")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(createIntent())
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(context).notify(
            NOTIFICATION_ID_SOURCE_UNAVAILABLE,
            notification,
        )
    }

    fun showNewChannelsDetected(count: Int) {
        val notification = NotificationCompat.Builder(context, CHANNEL_CHANNELS)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentTitle("قنوات جديدة")
            .setContentText("تم اكتشاف $count قناة جديدة")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(createIntent())
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(context).notify(
            NOTIFICATION_ID_NEW_CHANNELS,
            notification,
        )
    }
}
