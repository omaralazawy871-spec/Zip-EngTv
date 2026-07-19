package com.engtv.worker

import android.content.Context
import androidx.work.WorkInfo
import androidx.work.WorkManager
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

sealed class SyncStatus {
    data object Idle : SyncStatus()
    data object Syncing : SyncStatus()
    data class Success(
        val timestamp: Long = System.currentTimeMillis(),
        val channelsCount: Int = 0,
    ) : SyncStatus()

    data class Failed(val error: String) : SyncStatus()
}

@Singleton
class SyncStatusRepository @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val _lastSyncStatus = MutableStateFlow<SyncStatus>(SyncStatus.Idle)
    val lastSyncStatus: StateFlow<SyncStatus> = _lastSyncStatus.asStateFlow()

    fun updateStatus(status: SyncStatus) {
        _lastSyncStatus.value = status
    }

    fun syncNow() {
        SyncWorker.syncNow(context)
    }

    fun observeStatus(): Flow<WorkInfo.State> {
        return WorkManager.getInstance(context)
            .getWorkInfosForUniqueWorkFlow(SyncWorker.ONE_TIME_WORK)
            .map { list -> list.firstOrNull()?.state ?: WorkInfo.State.ENQUEUED }
    }
}
