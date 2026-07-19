package com.engtv.core.crash

/**
 * Abstraction for crash reporting.
 *
 * Default implementation is a no-op.
 * To enable Firebase Crashlytics:
 *   1. Add google-services.json to app/ directory
 *   2. Uncomment Firebase plugin & dependency in build.gradle.kts
 *   3. Replace [NoOpCrashReporter] binding with [FirebaseCrashReporter] in DI module
 */
interface CrashReporter {
    fun logException(throwable: Throwable)
    fun logMessage(message: String)
    fun setUserId(userId: String)
}

class NoOpCrashReporter : CrashReporter {
    override fun logException(throwable: Throwable) {}
    override fun logMessage(message: String) {}
    override fun setUserId(userId: String) {}
}
