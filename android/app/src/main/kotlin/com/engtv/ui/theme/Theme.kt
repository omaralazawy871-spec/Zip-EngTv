package com.engtv.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val EngTvColorScheme = darkColorScheme(
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

@Composable
fun EngTvTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = EngTvColorScheme,
        typography  = EngTvTypography,
        content     = content,
    )
}
