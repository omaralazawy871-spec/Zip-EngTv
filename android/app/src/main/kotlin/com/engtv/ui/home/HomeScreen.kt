package com.engtv.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.engtv.data.database.entities.WatchHistoryEntity
import com.engtv.data.models.Category
import com.engtv.data.models.Channel
import com.engtv.ui.theme.*

@Composable
fun HomeScreen(
    onChannelClick: (Int) -> Unit,
    onCategoryClick: (Int) -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val uiState  by viewModel.uiState.collectAsStateWithLifecycle()
    val channels  by viewModel.channels.collectAsStateWithLifecycle()
    val categories by viewModel.categories.collectAsStateWithLifecycle()
    val history   by viewModel.watchHistory.collectAsStateWithLifecycle()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
    ) {
        when {
            uiState.isLoading && channels.isEmpty() -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = Primary,
                )
            }

            uiState.error != null && channels.isEmpty() -> {
                Column(
                    modifier = Modifier
                        .align(Alignment.Center)
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    Text(
                        text = "تعذّر تحميل القنوات",
                        style = MaterialTheme.typography.titleMedium,
                        color = OnSurface,
                        textAlign = TextAlign.Center,
                    )
                    Text(
                        text = uiState.error ?: "",
                        style = MaterialTheme.typography.bodyMedium,
                        color = OnSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                    Button(
                        onClick = viewModel::refresh,
                        colors = ButtonDefaults.buttonColors(containerColor = Primary),
                    ) {
                        Text("إعادة المحاولة")
                    }
                }
            }

            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 88.dp),
                ) {

                    // ── Resume Last Channel ───────────────────────────────
                    // Shown only when there is watch history.
                    // Displays the most recently watched channel as a
                    // prominent resume card so the user can jump back in.
                    if (history.isNotEmpty()) {
                        item {
                            val last = history.first()
                            SectionTitle("استأنف المشاهدة")
                            ResumeCard(entry = last, onClick = { onChannelClick(last.channelId) })
                            Spacer(Modifier.height(8.dp))
                        }

                        // Secondary: show the rest of the history as a horizontal strip
                        if (history.size > 1) {
                            item {
                                SectionTitle("شاهدت مؤخراً")
                                LazyRow(
                                    contentPadding = PaddingValues(horizontal = 16.dp),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                ) {
                                    items(history.drop(1)) { entry ->
                                        ChannelCard(
                                            name    = entry.channelName,
                                            logoUrl = entry.logoUrl,
                                            onClick = { onChannelClick(entry.channelId) },
                                            modifier = Modifier.width(120.dp),
                                        )
                                    }
                                }
                                Spacer(Modifier.height(24.dp))
                            }
                        }
                    }

                    // ── Categories ────────────────────────────────────────
                    if (categories.isNotEmpty()) {
                        item {
                            SectionTitle("الفئات")
                            LazyRow(
                                contentPadding = PaddingValues(horizontal = 16.dp),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                items(categories) { cat ->
                                    CategoryChip(cat, onClick = { onCategoryClick(cat.id) })
                                }
                            }
                            Spacer(Modifier.height(24.dp))
                        }
                    }

                    // ── All Channels ──────────────────────────────────────
                    item { SectionTitle("جميع القنوات") }

                    if (channels.isEmpty()) {
                        item {
                            Text(
                                text = "لا توجد قنوات متاحة حالياً.\nأضف مصدر IPTV من لوحة التحكم.",
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                textAlign = TextAlign.Center,
                                color = OnSurfaceVariant,
                                style = MaterialTheme.typography.bodyLarge,
                            )
                        }
                    } else {
                        items(channels.chunked(2)) { row ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                            ) {
                                row.forEach { channel ->
                                    ChannelCard(
                                        name    = channel.name,
                                        logoUrl = channel.logoUrl,
                                        onClick = { onChannelClick(channel.id) },
                                        modifier = Modifier.weight(1f),
                                    )
                                }
                                if (row.size == 1) Spacer(Modifier.weight(1f))
                            }
                            Spacer(Modifier.height(12.dp))
                        }
                    }
                }
            }
        }
    }
}

// ── Resume Card ───────────────────────────────────────────────────────────────

@Composable
private fun ResumeCard(entry: WatchHistoryEntity, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = SurfaceContainer,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clickable(onClick = onClick),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Channel logo / placeholder
            if (entry.logoUrl != null) {
                AsyncImage(
                    model = entry.logoUrl,
                    contentDescription = entry.channelName,
                    modifier = Modifier
                        .size(72.dp)
                        .clip(RoundedCornerShape(12.dp)),
                    contentScale = ContentScale.Fit,
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(SurfaceVariant),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("📺", style = MaterialTheme.typography.headlineMedium)
                }
            }

            // Channel info + play prompt
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Text(
                    text = entry.channelName,
                    style = MaterialTheme.typography.titleMedium,
                    color = OnSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = "انقر للاستئناف",
                    style = MaterialTheme.typography.bodySmall,
                    color = OnSurfaceVariant,
                )
            }

            // Play icon
            Icon(
                imageVector = Icons.Filled.PlayArrow,
                contentDescription = "تشغيل",
                tint = Primary,
                modifier = Modifier.size(36.dp),
            )
        }
    }
}

// ── Reusable composables ──────────────────────────────────────────────────────

@Composable
private fun SectionTitle(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        color = OnSurface,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
    )
}

@Composable
private fun CategoryChip(category: Category, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = SurfaceVariant,
        modifier = Modifier.clickable(onClick = onClick),
    ) {
        Text(
            text = "${category.icon ?: ""} ${category.name}".trim(),
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            style = MaterialTheme.typography.labelLarge,
            color = OnSurface,
        )
    }
}

/**
 * Reusable channel card used by Home, Search, Favorites, and Category screens.
 * Exported from this file so sibling packages can import it without a shared
 * components module.
 */
@Composable
fun ChannelCard(
    name: String,
    logoUrl: String?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = SurfaceVariant,
        modifier = modifier.clickable(onClick = onClick),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (logoUrl != null) {
                AsyncImage(
                    model = logoUrl,
                    contentDescription = name,
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(8.dp)),
                    contentScale = ContentScale.Fit,
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(SurfaceContainer),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("📺", style = MaterialTheme.typography.headlineMedium)
                }
            }
            Text(
                text = name,
                style = MaterialTheme.typography.bodyMedium,
                color = OnSurface,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center,
            )
        }
    }
}
