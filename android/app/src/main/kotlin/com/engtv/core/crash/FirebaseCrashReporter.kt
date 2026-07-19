package com.engtv.core.crash

/**
 * Firebase Crashlytics implementation of [CrashReporter].
 *
 * To activate:
 *   1. Uncomment Firebase plugin & dependency in build.gradle.kts
 *   2. Place google-services.json in app/
 *   3. In AppModule, replace: bind(NoOpCrashReporter::class.java).to(CrashReporter::class.java)
 *      with: bind(FirebaseCrashReporter::class.java).to(CrashReporter::class.java)
 *
 * Note: Firebase Analytics must also be present for Crashlytics to function.
 * No user-identifying data (usernames, passwords, tokens, stream URLs) is passed to logException.
 */
// class FirebaseCrashReporter : CrashReporter {
//     override fun logException(throwable: Throwable) {
//         FirebaseCrashlytics.getInstance().recordException(throwable)
//     }
//
//     override fun logMessage(message: String) {
//         FirebaseCrashlytics.getInstance().log(message)
//     }
//
//     override fun setUserId(userId: String) {
//         FirebaseCrashlytics.getInstance().setUserId(userId)
//     }
// }
