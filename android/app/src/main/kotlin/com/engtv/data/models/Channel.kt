package com.engtv.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Channel(
    val id: Int,
    val name: String,
    @SerialName("stream_url") val streamUrl: String,
    @SerialName("logo_url") val logoUrl: String? = null,
    @SerialName("category_id") val categoryId: Int? = null,
    @SerialName("source_id") val sourceId: Int? = null,
    @SerialName("external_id") val externalId: String? = null,
    @SerialName("is_active") val isActive: Boolean = true,
    @SerialName("sort_order") val sortOrder: Int = 0,
    @SerialName("created_at") val createdAt: String? = null,
)
