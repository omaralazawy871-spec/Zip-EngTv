package com.engtv.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class AdminLoginRequest(
    val password: String,
)

@Serializable
data class AdminLoginResponse(
    val token: String,
)
