package com.engtv.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import com.engtv.data.models.ThemeMode

private val DarkColorScheme = darkColorScheme(
    primary             = Primary,
    onPrimary           = OnPrimary,
    secondary           = Secondary,
    onSecondary         = OnPrimary,
    background          = Background,
    onBackground        = OnBackground,
    surface             = Surface,
    onSurface           = OnSurface,
    surfaceVariant      = SurfaceVariant,
    onSurfaceVariant    = OnSurfaceVariant,
    surfaceContainer    = SurfaceContainer,
    error               = Error,
    onError             = OnError,
    errorContainer      = ErrorContainer,
    outline             = Outline,
    outlineVariant      = OutlineVariant,
)

private val LightColorScheme = lightColorScheme(
    primary             = Primary,
    onPrimary           = LightOnPrimary,
    secondary           = Secondary,
    onSecondary         = LightOnPrimary,
    background          = LightBackground,
    onBackground        = LightOnBackground,
    surface             = LightSurface,
    onSurface           = LightOnSurface,
    surfaceVariant      = LightSurfaceVariant,
    onSurfaceVariant    = LightOnSurfaceVariant,
    surfaceContainer    = LightSurfaceContainer,
    error               = Error,
    onError             = LightOnError,
    errorContainer      = LightErrorContainer,
    outline             = LightOutline,
    outlineVariant      = LightOutlineVariant,
)

@Composable
fun EngTvTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    content: @Composable () -> Unit,
) {
    val isDark = when (themeMode) {
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
    }
    MaterialTheme(
        colorScheme = if (isDark) DarkColorScheme else LightColorScheme,
        typography  = EngTvTypography,
        content     = content,
    )
}
