package com.engtv.ui.player

import android.app.Activity
import android.app.PictureInPictureParams
import android.content.pm.PackageManager
import android.os.Build
import android.util.Rational
import android.view.ViewGroup
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PictureInPictureAlt
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.Subtitles
import androidx.compose.material.icons.filled.HighQuality
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.media3.ui.PlayerView
import coil.compose.AsyncImage
import com.engtv.data.models.Channel
import com.engtv.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun PlayerScreen(
    channelId: Int,
    onBack: () -> Unit,
    viewModel: PlayerViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val activity = context as? Activity

    LaunchedEffect(channelId) {
        viewModel.loadChannel(channelId)
    }

    var showControls by remember { mutableStateOf(true) }

    LaunchedEffect(showControls, uiState.isPlaying) {
        if (showControls && uiState.isPlaying) {
            delay(4000)
            showControls = false
        }
    }

    val pipSupported = remember {
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.N &&
            context.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .clickable(
                indication = null,
                interactionSource = remember { MutableInteractionSource() },
            ) { showControls = !showControls },
    ) {
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT,
                    )
                    player = viewModel.playerManager.player
                    useController = false
                    setShowBuffering(PlayerView.SHOW_BUFFERING_WHEN_PLAYING)
                }
            },
            modifier = Modifier.fillMaxSize(),
        )

        if (uiState.isBuffering) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center,
            ) {
                CircularProgressIndicator(color = Primary)
            }
        }

        if (uiState.isLoading && !uiState.isBuffering) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.Center),
                color = Primary,
            )
        }

        if (uiState.error != null) {
            Column(
                modifier = Modifier.align(Alignment.Center),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(
                    text = "خطأ في التشغيل",
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium,
                )
                Text(
                    text = uiState.error ?: "",
                    color = Color.White.copy(alpha = 0.7f),
                    style = MaterialTheme.typography.bodyMedium,
                )
                Button(onClick = viewModel::retry) {
                    Text("إعادة المحاولة")
                }
            }
        }

        AnimatedVisibility(
            visible = showControls,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                Column(modifier = Modifier.fillMaxSize()) {
                    TopOverlay(
                        channel = uiState.channel,
                        isFavorite = uiState.isFavorite,
                        pipSupported = pipSupported,
                        onBack = onBack,
                        onToggleFavorite = viewModel::toggleFavorite,
                        onOpenExternal = { viewModel.openInExternalPlayer(context) },
                        onPip = {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && activity != null) {
                                val params = PictureInPictureParams.Builder()
                                    .setAspectRatio(Rational(16, 9))
                                    .setAutoEnterEnabled(true)
                                    .build()
                                activity.enterPictureInPictureMode(params)
                            }
                        },
                        onToggleQuality = viewModel::toggleQualitySelector,
                        onToggleSubtitle = viewModel::toggleSubtitleSelector,
                        onToggleAudio = viewModel::toggleAudioSelector,
                    )

                    Spacer(Modifier.weight(1f))

                    BottomControls(
                        isPlaying = uiState.isPlaying,
                        currentPosition = uiState.currentPosition,
                        duration = uiState.duration,
                        onTogglePlay = viewModel::togglePlayPause,
                        onSeek = viewModel::seekTo,
                    )

                    if (uiState.relatedChannels.isNotEmpty()) {
                        RelatedChannelsRow(
                            channels = uiState.relatedChannels,
                            onChannelClick = { /* Navigate handled by NavGraph */ },
                        )
                    }
                }

                SelectorPanel(
                    visible = uiState.showQualitySelector,
                    title = "الجودة",
                    options = uiState.availableQualities.map {
                        SelectorOption(it.index, it.label)
                    },
                    selectedIndex = uiState.selectedQualityIndex,
                    onSelect = { viewModel.selectQuality(it) },
                    onDismiss = viewModel::toggleQualitySelector,
                )

                SelectorPanel(
                    visible = uiState.showSubtitleSelector,
                    title = "الترجمة",
                    options = uiState.subtitleTracks.map {
                        SelectorOption(it.index, it.label)
                    },
                    selectedIndex = uiState.selectedSubtitleIndex,
                    onSelect = { viewModel.selectSubtitle(it) },
                    onDismiss = viewModel::toggleSubtitleSelector,
                )

                SelectorPanel(
                    visible = uiState.showAudioSelector,
                    title = "الصوت",
                    options = uiState.audioTracks.map {
                        SelectorOption(it.index, it.label)
                    },
                    selectedIndex = uiState.selectedAudioIndex,
                    onSelect = { viewModel.selectAudio(it) },
                    onDismiss = viewModel::toggleAudioSelector,
                )
            }
        }
    }
}

@Composable
private fun TopOverlay(
    channel: Channel?,
    isFavorite: Boolean,
    pipSupported: Boolean,
    onBack: () -> Unit,
    onToggleFavorite: () -> Unit,
    onOpenExternal: () -> Unit,
    onPip: () -> Unit,
    onToggleQuality: () -> Unit,
    onToggleSubtitle: () -> Unit,
    onToggleAudio: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color.Black.copy(alpha = 0.8f), Color.Transparent),
                )
            )
            .statusBarsPadding()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "رجوع",
                        tint = Color.White,
                    )
                }
                if (channel != null) {
                    Text(
                        text = channel.name,
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(0.dp)) {
                IconButton(onClick = onToggleQuality) {
                    Icon(
                        imageVector = Icons.Filled.HighQuality,
                        contentDescription = "الجودة",
                        tint = Color.White,
                    )
                }
                IconButton(onClick = onToggleSubtitle) {
                    Icon(
                        imageVector = Icons.Filled.Subtitles,
                        contentDescription = "الترجمة",
                        tint = Color.White,
                    )
                }
                IconButton(onClick = onToggleAudio) {
                    Icon(
                        imageVector = Icons.Filled.VolumeUp,
                        contentDescription = "الصوت",
                        tint = Color.White,
                    )
                }
                IconButton(onClick = onToggleFavorite) {
                    Icon(
                        imageVector = if (isFavorite) Icons.Filled.Favorite
                        else Icons.Filled.FavoriteBorder,
                        contentDescription = "مفضلة",
                        tint = if (isFavorite) Error else Color.White,
                    )
                }
                IconButton(onClick = onOpenExternal) {
                    Icon(
                        imageVector = Icons.Filled.OpenInNew,
                        contentDescription = "فتح بمشغل خارجي",
                        tint = Color.White,
                    )
                }
                if (pipSupported) {
                    IconButton(onClick = onPip) {
                        Icon(
                            imageVector = Icons.Filled.PictureInPictureAlt,
                            contentDescription = "صورة داخل صورة",
                            tint = Color.White,
                        )
                    }
                }
            }
        }
    }
}

private fun formatDuration(ms: Long): String {
    if (ms < 0) return "00:00"
    val totalSeconds = ms / 1000
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return if (hours > 0) {
        String.format("%d:%02d:%02d", hours, minutes, seconds)
    } else {
        String.format("%02d:%02d", minutes, seconds)
    }
}

@Composable
private fun BottomControls(
    isPlaying: Boolean,
    currentPosition: Long,
    duration: Long,
    onTogglePlay: () -> Unit,
    onSeek: (Long) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.8f)),
                )
            )
            .navigationBarsPadding()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = formatDuration(currentPosition),
                style = MaterialTheme.typography.labelSmall,
                color = Color.White.copy(alpha = 0.8f),
            )

            Slider(
                value = if (duration > 0) (currentPosition.toFloat() / duration.toFloat()).coerceIn(0f, 1f) else 0f,
                onValueChange = { fraction ->
                    onSeek((fraction * duration).toLong())
                },
                modifier = Modifier.weight(1f),
                colors = SliderDefaults.colors(
                    thumbColor = Primary,
                    activeTrackColor = Primary,
                    inactiveTrackColor = Color.White.copy(alpha = 0.3f),
                ),
            )

            Text(
                text = formatDuration(duration),
                style = MaterialTheme.typography.labelSmall,
                color = Color.White.copy(alpha = 0.8f),
            )
        }

        Spacer(Modifier.height(8.dp))

        IconButton(
            onClick = onTogglePlay,
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.2f)),
        ) {
            Icon(
                imageVector = if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                contentDescription = if (isPlaying) "إيقاف مؤقت" else "تشغيل",
                tint = Color.White,
                modifier = Modifier.size(32.dp),
            )
        }
    }
}

private data class SelectorOption(val index: Int, val label: String)

@Composable
private fun SelectorPanel(
    visible: Boolean,
    title: String,
    options: List<SelectorOption>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    onDismiss: () -> Unit,
) {
    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(),
        exit = fadeOut(),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clickable(
                    indication = null,
                    interactionSource = remember { MutableInteractionSource() },
                    onClick = onDismiss,
                ),
        ) {
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .clickable(
                        indication = null,
                        interactionSource = remember { MutableInteractionSource() },
                        onClick = {},
                    ),
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
                color = Surface,
                tonalElevation = 8.dp,
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        color = OnSurface,
                        modifier = Modifier.padding(bottom = 12.dp),
                    )
                    options.forEach { option ->
                        val selected = option.index == selectedIndex
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelect(option.index) }
                                .padding(vertical = 12.dp, horizontal = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = option.label,
                                style = MaterialTheme.typography.bodyLarge,
                                color = if (selected) Primary else OnSurface,
                            )
                            if (selected) {
                                Text(
                                    text = "✓",
                                    color = Primary,
                                    style = MaterialTheme.typography.bodyLarge,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RelatedChannelsRow(
    channels: List<Channel>,
    onChannelClick: (Int) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Surface.copy(alpha = 0.95f))
            .padding(vertical = 12.dp),
    ) {
        Text(
            text = "قنوات مشابهة",
            style = MaterialTheme.typography.titleSmall,
            color = OnSurface,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
        )
        LazyRow(
            contentPadding = PaddingValues(horizontal = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(channels, key = { it.id }) { channel ->
                RelatedChannelItem(
                    name = channel.name,
                    logoUrl = channel.logoUrl,
                    onClick = { onChannelClick(channel.id) },
                )
            }
        }
    }
}

@Composable
private fun RelatedChannelItem(
    name: String,
    logoUrl: String?,
    onClick: () -> Unit,
) {
    Surface(
        modifier = Modifier
            .width(100.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        color = SurfaceVariant,
    ) {
        Column(
            modifier = Modifier.padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            if (logoUrl != null) {
                AsyncImage(
                    model = logoUrl,
                    contentDescription = name,
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(8.dp)),
                    contentScale = ContentScale.Fit,
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(SurfaceContainer),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("📺", style = MaterialTheme.typography.headlineSmall)
                }
            }
            Spacer(Modifier.height(4.dp))
            Text(
                text = name,
                style = MaterialTheme.typography.labelSmall,
                color = OnSurface,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center,
            )
        }
    }
}


