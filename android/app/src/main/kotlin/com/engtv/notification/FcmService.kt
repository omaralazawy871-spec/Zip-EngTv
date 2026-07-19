package com.engtv.notification

/**
 * Firebase Cloud Messaging — Architecture Notes
 * ==============================================
 *
 * All notifications are currently handled locally via [NotificationHelper].
 *
 * To enable FCM push notifications in the future:
 *
 * 1. Add to root build.gradle.kts:
 *        id("com.google.gms.google-services") version "4.4.2" apply false
 *
 * 2. Add to app/build.gradle.kts:
 *        id("com.google.gms.google-services")
 *        implementation("com.google.firebase:firebase-messaging-ktx:24.1.1")
 *
 * 3. Place `google-services.json` (from Firebase Console) in the app/ directory.
 *
 * 4. Create a service class (uncomment below):
 *
 *        class EngTvFcmService : FirebaseMessagingService() {
 *            override fun onMessageReceived(message: RemoteMessage) {
 *                // Parse message.data and show local notification
 *                // via NotificationHelper
 *            }
 *            override fun onNewToken(token: String) {
 *                // Send token to your backend for targeted push
 *            }
 *        }
 *
 * 5. Register the service in AndroidManifest.xml:
 *
 *        <service
 *            android:name=".notification.EngTvFcmService"
 *            android:exported="false">
 *            <intent-filter>
 *                <action android:name="com.google.firebase.MESSAGING_EVENT" />
 *            </intent-filter>
 *        </service>
 *
 * 6. (Optional) Add POST_NOTIFICATIONS permission request on Android 13+.
 *
 * Current architecture: All notification logic lives in [NotificationHelper].
 * The SyncWorker posts sync-completed / sync-failed notifications directly.
 * Source-unavailable and new-channel notifications are also triggered locally.
 */
