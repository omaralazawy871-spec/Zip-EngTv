package com.engtv.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Source(
    val id: Int,
    val name: String,
    val type: String,
    val url: String,
    val username: String? = null,
    val password: String? = null,
    @SerialName("is_active") val isActive: Boolean = true,
    @SerialName("last_synced_at") val lastSyncedAt: String? = null,
    @SerialName("sync_status") val syncStatus: String = "idle",
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class SyncHistory(
    val id: Int,
    @SerialName("source_id") val sourceId: Int,
    val status: String,
    @SerialName("channels_added") val channelsAdded: Int = 0,
    @SerialName("channels_updated") val channelsUpdated: Int = 0,
    @SerialName("error_message") val errorMessage: String? = null,
    @SerialName("started_at") val startedAt: String,
    @SerialName("completed_at") val completedAt: String? = null,
)

@Serializable
data class SourceCreateRequest(
    val name: String,
    val type: String,
    val url: String,
    val username: String? = null,
    val password: String? = null,
)

@Serializable
data class SourceUpdateRequest(
    val name: String? = null,
    val type: String? = null,
    val url: String? = null,
    val username: String? = null,
    val password: String? = null,
    @SerialName("is_active") val isActive: Boolean? = null,
)
