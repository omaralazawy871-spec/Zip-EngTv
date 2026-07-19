package com.engtv.ui.category

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.animateItemPlacement
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.engtv.ui.components.CategoryShimmer
import com.engtv.ui.components.ChannelCard
import com.engtv.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CategoryScreen(
    categoryId: Int,
    onChannelClick: (Int) -> Unit,
    onBack: () -> Unit,
    viewModel: CategoryViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(categoryId) { viewModel.load(categoryId) }

    Scaffold(
        containerColor = Background,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = uiState.category?.let {
                                "${it.icon ?: ""} ${it.name}".trim()
                            } ?: "القنوات",
                            color = OnSurface,
                        )
                        uiState.category?.let { cat ->
                            Text(
                                text = "${cat.channels.size} قناة",
                                style = MaterialTheme.typography.bodySmall,
                                color = OnSurfaceVariant,
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "رجوع",
                            tint = OnSurface,
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Surface),
            )
        },
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Background),
        ) {
            when {
                uiState.isLoading -> {
                    CategoryShimmer(modifier = Modifier.fillMaxSize())
                }

                uiState.error != null -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text(uiState.error!!, color = OnSurfaceVariant, textAlign = TextAlign.Center)
                        Button(onClick = { viewModel.load(categoryId) }) {
                            Text("إعادة المحاولة")
                        }
                    }
                }

                uiState.category?.channels?.isEmpty() == true -> {
                    Text(
                        text = "لا توجد قنوات في هذه الفئة",
                        modifier = Modifier
                            .align(Alignment.Center)
                            .padding(32.dp),
                        color = OnSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                }

                else -> {
                    val channels = uiState.category?.channels ?: emptyList()
                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(
                            channels.chunked(2),
                            key = { it.map { c -> c.id }.toString() },
                        ) { row ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .animateItemPlacement(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                            ) {
                                row.forEach { channel ->
                                    ChannelCard(
                                        name = channel.name,
                                        logoUrl = channel.logoUrl,
                                        onClick = { onChannelClick(channel.id) },
                                        modifier = Modifier.weight(1f),
                                    )
                                }
                                if (row.size == 1) Spacer(Modifier.weight(1f))
                            }
                        }
                    }
                }
            }
        }
    }
}
