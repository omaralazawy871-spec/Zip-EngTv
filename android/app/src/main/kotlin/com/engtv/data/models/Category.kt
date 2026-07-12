package com.engtv.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Category(
    val id: Int,
    val name: String,
    val icon: String? = null,
    @SerialName("sort_order") val sortOrder: Int = 0,
    @SerialName("is_visible") val isVisible: Boolean = true,
    @SerialName("created_at") val createdAt: String? = null,
    /** Only present when fetching a single category with GET /categories/{id} */
    val channels: List<Channel> = emptyList(),
)
