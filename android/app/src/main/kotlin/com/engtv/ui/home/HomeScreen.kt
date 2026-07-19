package com.engtv.ui.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.animateItemPlacement
import androidx.compose.foundation.lazy.itemsIndexed
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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.paging.compose.collectAsLazyPagingItems
import coil.compose.AsyncImage
import com.engtv.data.database.entities.WatchHistoryEntity
import com.engtv.data.models.Category
import com.engtv.data.models.Channel
import com.engtv.ui.components.ChannelCard
import com.engtv.ui.components.HomeShimmer
import com.engtv.ui.theme.*

@Composable
fun HomeScreen(
    onChannelClick: (Int) -> Unit,
    onCategoryClick: (Int) -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val uiState  by viewModel.uiState.collectAsStateWithLifecycle()
    val pagedChannels = viewModel.pagedChannels.collectAsLazyPagingItems()
    val categories by viewModel.categories.collectAsStateWithLifecycle()
    val history   by viewModel.watchHistory.collectAsStateWithLifecycle()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
    ) {
        AnimatedVisibility(
            visible = uiState.isLoading && pagedChannels.itemCount == 0,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            HomeShimmer(modifier = Modifier.fillMaxSize())
        }

        AnimatedVisibility(
            visible = uiState.error != null && pagedChannels.itemCount == 0,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text(
                    text = "تعذّر تحميل القنوات",
                    style = MaterialTheme.typography.titleMedium,
                    color = OnSurface,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = uiState.error ?: "",
                    style = MaterialTheme.typography.bodyMedium,
                    color = OnSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = viewModel::refresh,
                    colors = ButtonDefaults.buttonColors(containerColor = Primary),
                ) {
                    Text("إعادة المحاولة")
                }
            }
        }

        AnimatedVisibility(
            visible = !uiState.isLoading || pagedChannels.itemCount > 0,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 88.dp),
            ) {

                if (history.isNotEmpty()) {
                    item {
                        val last = history.first()
                        SectionTitle("استأنف المشاهدة")
                        ResumeCard(entry = last, onClick = { onChannelClick(last.channelId) })
                        Spacer(Modifier.height(8.dp))
                    }

                    if (history.size > 1) {
                        item {
                            SectionTitle("شاهدت مؤخراً")
                            LazyRow(
                                contentPadding = PaddingValues(horizontal = 16.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                            ) {
                                items(history.drop(1), key = { it.channelId }) { entry ->
                                    ChannelCard(
                                        name    = entry.channelName,
                                        logoUrl = entry.logoUrl,
                                        onClick = { onChannelClick(entry.channelId) },
                                        modifier = Modifier
                                            .width(120.dp)
                                            .animateItemPlacement(),
                                    )
                                }
                            }
                            Spacer(Modifier.height(24.dp))
                        }
                    }
                }

                if (categories.isNotEmpty()) {
                    item {
                        SectionTitle("الفئات")
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            items(categories, key = { it.id }) { cat ->
                                CategoryChip(cat, onClick = { onCategoryClick(cat.id) })
                            }
                        }
                        Spacer(Modifier.height(24.dp))
                    }
                }

                item { SectionTitle("جميع القنوات") }

                if (pagedChannels.itemCount == 0 && !uiState.isLoading) {
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
                    itemsIndexed(
                        count = (pagedChannels.itemCount + 1) / 2,
                        key = { rowIndex -> "channel_row_$rowIndex" },
                    ) { rowIndex, _ ->
                        val first = rowIndex * 2
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp)
                                .animateItemPlacement(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            val ch0 = pagedChannels[first]
                            if (ch0 != null) {
                                ChannelCard(
                                    name    = ch0.name,
                                    logoUrl = ch0.logoUrl,
                                    onClick = { onChannelClick(ch0.id) },
                                    modifier = Modifier.weight(1f),
                                )
                            }
                            val second = first + 1
                            if (second < pagedChannels.itemCount) {
                                val ch1 = pagedChannels[second]
                                if (ch1 != null) {
                                    ChannelCard(
                                        name    = ch1.name,
                                        logoUrl = ch1.logoUrl,
                                        onClick = { onChannelClick(ch1.id) },
                                        modifier = Modifier.weight(1f),
                                    )
                                }
                            } else {
                                Spacer(Modifier.weight(1f))
                            }
                        }
                        Spacer(Modifier.height(12.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun ResumeCard(entry: WatchHistoryEntity, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = SurfaceContainer,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clickable(onClick = onClick)
            .semantics { contentDescription = "استئناف مشاهدة ${entry.channelName}" },
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
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

            Icon(
                imageVector = Icons.Filled.PlayArrow,
                contentDescription = "تشغيل",
                tint = Primary,
                modifier = Modifier.size(36.dp),
            )
        }
    }
}

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
        modifier = Modifier
            .clickable(onClick = onClick)
            .semantics { contentDescription = "فئة: ${category.name}" },
    ) {
        Text(
            text = "${category.icon ?: ""} ${category.name}".trim(),
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            style = MaterialTheme.typography.labelLarge,
            color = OnSurface,
        )
    }
}
