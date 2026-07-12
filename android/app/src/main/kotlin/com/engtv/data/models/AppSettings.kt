package com.engtv.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class AppSettings(
    @SerialName("app_name") val appName: String = "EngTv",
    @SerialName("app_logo_url") val appLogoUrl: String? = null,
    @SerialName("primary_color") val primaryColor: String? = null,
    @SerialName("secondary_color") val secondaryColor: String? = null,
    @SerialName("footer_text") val footerText: String? = null,
)
