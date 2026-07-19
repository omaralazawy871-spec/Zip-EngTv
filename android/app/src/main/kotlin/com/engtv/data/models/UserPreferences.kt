package com.engtv.data.models

data class UserPreferences(
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val language: AppLanguage = AppLanguage.ARABIC,
    val autoPlayLastChannel: Boolean = true,
    val rememberQuality: Boolean = false,
    val defaultPlayer: PlayerType = PlayerType.INTERNAL,
)

enum class ThemeMode { SYSTEM, LIGHT, DARK }
enum class AppLanguage { ARABIC, ENGLISH }
enum class PlayerType { INTERNAL, EXTERNAL }
