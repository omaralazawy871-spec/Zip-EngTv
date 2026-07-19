package com.engtv.ui.developer

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.engtv.data.models.Source
import com.engtv.ui.theme.Background
import com.engtv.ui.theme.Error
import com.engtv.ui.theme.OnPrimary
import com.engtv.ui.theme.OnSurface
import com.engtv.ui.theme.OnSurfaceVariant
import com.engtv.ui.theme.Outline
import com.engtv.ui.theme.Primary
import com.engtv.ui.theme.Surface
import com.engtv.ui.theme.SurfaceVariant

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeveloperScreen(
    onBack: () -> Unit,
    viewModel: DeveloperViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    LaunchedEffect(uiState.error) {
        uiState.error?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            viewModel.clearError()
        }
    }

    if (uiState.isRestoringAuth) {
        Box(
            modifier = Modifier.fillMaxSize().background(Background),
            contentAlignment = Alignment.Center,
        ) {
            CircularProgressIndicator(color = Primary)
        }
        return
    }

    if (!uiState.isAuthenticated) {
        LoginScreen(
            loginError = uiState.loginError,
            isLoggingIn = uiState.isLoggingIn,
            onLogin = { viewModel.login(it) },
        )
        return
    }

    Scaffold(
        containerColor = Background,
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.Lock,
                            contentDescription = null,
                            tint = Primary,
                            modifier = Modifier.size(20.dp),
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("وضع المطور", color = OnSurface)
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
                actions = {
                    IconButton(onClick = { viewModel.logout() }) {
                        Text("خروج", color = Error)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Surface),
            )
        },
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Background),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                Text(
                    text = "هذه الشاشة خاصة بالمطورين فقط",
                    style = MaterialTheme.typography.bodyMedium,
                    color = OnSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                )
            }

            // ── Source Management ──────────────────────────────────────────
            item {
                SectionHeader("إدارة المصادر")
            }

            if (uiState.isLoading) {
                item {
                    CircularProgressIndicator(
                        modifier = Modifier
                            .align(Alignment.CenterHorizontally)
                            .padding(32.dp),
                        color = Primary,
                    )
                }
            } else {
                items(uiState.sources, key = { it.id }) { source ->
                    SourceCard(
                        source = source,
                        onEdit = { viewModel.showEditDialog(source) },
                        onDelete = { viewModel.requestDelete(source) },
                        onSync = { viewModel.forceSync(source.id) },
                    )
                }

                item {
                    OutlinedButton(
                        onClick = { viewModel.showAddDialog() },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary),
                    ) {
                        Icon(Icons.Filled.Add, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("إضافة مصدر جديد")
                    }
                }
            }

            // ── Sync Status ────────────────────────────────────────────────
            item {
                Spacer(Modifier.height(8.dp))
                SectionHeader("حالة المزامنة")
            }

            item {
                SyncStatusCard(
                    syncStatus = uiState.syncStatus,
                    lastSyncTime = uiState.lastSyncTime,
                    isSyncingAll = uiState.isSyncingAll,
                    onSyncAll = { viewModel.forceSyncAll() },
                    onViewHistory = { viewModel.loadSyncHistory() },
                )
            }
        }
    }

    // ── Add/Edit Dialog ──────────────────────────────────────────────────
    if (uiState.showAddDialog) {
        SourceDialog(
            source = uiState.editingSource,
            onDismiss = { viewModel.hideDialog() },
            onSave = { name, type, url, username, password ->
                val existing = uiState.editingSource
                if (existing != null) {
                    viewModel.updateSource(existing.id, name, type, url, username, password)
                } else {
                    viewModel.addSource(name, type, url, username, password)
                }
            },
        )
    }

    // ── Delete Confirmation ──────────────────────────────────────────────
    uiState.showDeleteConfirm?.let { source ->
        AlertDialog(
            onDismissRequest = { viewModel.cancelDelete() },
            title = { Text("حذف المصدر", color = OnSurface) },
            text = {
                Text(
                    "هل أنت متأكد من حذف المصدر \"${source.name}\"?",
                    color = OnSurfaceVariant,
                )
            },
            confirmButton = {
                TextButton(onClick = { viewModel.confirmDelete(source.id) }) {
                    Text("حذف", color = Error)
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.cancelDelete() }) {
                    Text("إلغاء", color = OnSurfaceVariant)
                }
            },
            containerColor = SurfaceVariant,
        )
    }

    // ── Sync History Dialog ──────────────────────────────────────────────
    if (uiState.showSyncHistory) {
        AlertDialog(
            onDismissRequest = { viewModel.hideSyncHistory() },
            title = { Text("سجل المزامنة", color = OnSurface) },
            text = {
                Column {
                    if (uiState.syncHistory.isEmpty()) {
                        Text("لا يوجد سجل مزامنة", color = OnSurfaceVariant)
                    } else {
                        uiState.syncHistory.take(20).forEach { entry ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Text(
                                    text = when (entry.status) {
                                        "completed" -> "✅ مكتمل"
                                        "failed" -> "❌ فشل"
                                        else -> "⏳ قيد التنفيذ"
                                    },
                                    color = OnSurface,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                                Text(
                                    text = entry.startedAt.take(16),
                                    color = OnSurfaceVariant,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { viewModel.hideSyncHistory() }) {
                    Text("إغلاق", color = Primary)
                }
            },
            containerColor = SurfaceVariant,
        )
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        color = OnSurface,
        modifier = Modifier.padding(vertical = 4.dp),
    )
}

@Composable
private fun SourceCard(
    source: Source,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onSync: () -> Unit,
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceVariant),
        modifier = Modifier.animateContentSize(),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = source.name,
                    style = MaterialTheme.typography.titleSmall,
                    color = OnSurface,
                    modifier = Modifier.weight(1f),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(onClick = onSync, modifier = Modifier.size(32.dp)) {
                        Icon(
                            Icons.Filled.Refresh,
                            contentDescription = "مزامنة المصدر",
                            tint = Primary,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                    IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) {
                        Icon(
                            Icons.Filled.Sync,
                            contentDescription = "تعديل المصدر",
                            tint = OnSurfaceVariant,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                        Icon(
                            Icons.Filled.Delete,
                            contentDescription = "حذف المصدر",
                            tint = Error,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                }
            }

            Text(
                text = source.url,
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariant,
                maxLines = 1,
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    text = when (source.type.lowercase()) {
                        "m3u" -> "📺 M3U"
                        "ts" -> "🎬 TS"
                        else -> source.type
                    },
                    style = MaterialTheme.typography.labelSmall,
                    color = Primary,
                )
                val statusText = when (source.syncStatus) {
                    "syncing" -> "🔄 جاري المزامنة"
                    "failed" -> "❌ فشل"
                    else -> "✅ ${source.lastSyncedAt?.take(16) ?: "لم تتم المزامنة بعد"}"
                }
                Text(
                    text = statusText,
                    style = MaterialTheme.typography.labelSmall,
                    color = OnSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun SyncStatusCard(
    syncStatus: String,
    lastSyncTime: String?,
    isSyncingAll: Boolean,
    onSyncAll: () -> Unit,
    onViewHistory: () -> Unit,
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceVariant),
        modifier = Modifier.animateContentSize(),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Filled.CloudSync,
                        contentDescription = null,
                        tint = when (syncStatus) {
                            "syncing" -> Primary
                            "failed" -> Error
                            else -> OnSurfaceVariant
                        },
                        modifier = Modifier.size(20.dp),
                    )
                    Spacer(Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "المزامنة",
                            style = MaterialTheme.typography.titleSmall,
                            color = OnSurface,
                        )
                        if (lastSyncTime != null) {
                            Text(
                                text = "آخر مزامنة: ${lastSyncTime.take(16)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = OnSurfaceVariant,
                            )
                        }
                    }
                }

                AnimatedVisibility(visible = isSyncingAll, enter = fadeIn(), exit = fadeOut()) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Primary,
                        strokeWidth = 2.dp,
                    )
                }
            }

            if (syncStatus == "syncing" || isSyncingAll) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(14.dp),
                        color = Primary,
                        strokeWidth = 2.dp,
                    )
                    Text(
                        text = if (isSyncingAll) "جاري مزامنة جميع المصادر..." else "المزامنة قيد التشغيل...",
                        style = MaterialTheme.typography.bodySmall,
                        color = Primary,
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Button(
                    onClick = onSyncAll,
                    enabled = !isSyncingAll,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = Primary),
                ) {
                    Icon(Icons.Filled.Sync, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("مزامنة الكل")
                }
                OutlinedButton(
                    onClick = onViewHistory,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary),
                ) {
                    Text("سجل المزامنة")
                }
            }
        }
    }
}

@Composable
private fun SourceDialog(
    source: Source?,
    onDismiss: () -> Unit,
    onSave: (name: String, type: String, url: String, username: String?, password: String?) -> Unit,
) {
    var name by remember { mutableStateOf(source?.name ?: "") }
    var type by remember { mutableStateOf(source?.type ?: "m3u") }
    var url by remember { mutableStateOf(source?.url ?: "") }
    var username by remember { mutableStateOf(source?.username ?: "") }
    var password by remember { mutableStateOf(source?.password ?: "") }
    var showTypeDropdown by remember { mutableStateOf(false) }

    val isEdit = source != null
    val isValid = name.isNotBlank() && url.isNotBlank()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                if (isEdit) "تعديل المصدر" else "إضافة مصدر جديد",
                color = OnSurface,
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("اسم المصدر", color = OnSurfaceVariant) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = defaultFieldColors(),
                )

                OutlinedTextField(
                    value = type,
                    onValueChange = { type = it },
                    label = { Text("النوع", color = OnSurfaceVariant) },
                    placeholder = { Text("m3u أو ts", color = OnSurfaceVariant) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = defaultFieldColors(),
                )

                OutlinedTextField(
                    value = url,
                    onValueChange = { url = it },
                    label = { Text("الرابط", color = OnSurfaceVariant) },
                    placeholder = { Text("https://...", color = OnSurfaceVariant) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = defaultFieldColors(),
                )

                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    label = { Text("اسم المستخدم (اختياري)", color = OnSurfaceVariant) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = defaultFieldColors(),
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("كلمة المرور (اختياري)", color = OnSurfaceVariant) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = defaultFieldColors(),
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onSave(
                        name,
                        type,
                        url,
                        username.ifBlank { null },
                        password.ifBlank { null },
                    )
                },
                enabled = isValid,
            ) {
                Text(if (isEdit) "تحديث" else "إضافة", color = if (isValid) Primary else OnSurfaceVariant)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("إلغاء", color = OnSurfaceVariant)
            }
        },
        containerColor = SurfaceVariant,
    )
}

@Composable
private fun LoginScreen(
    loginError: String?,
    isLoggingIn: Boolean,
    onLogin: (String) -> Unit,
) {
    var password by remember { mutableStateOf("") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier.padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Icon(
                imageVector = Icons.Filled.Lock,
                contentDescription = null,
                tint = Primary,
                modifier = Modifier.size(48.dp),
            )
            Text(
                text = "تسجيل الدخول للمطورين",
                style = MaterialTheme.typography.titleLarge,
                color = OnSurface,
            )
            Text(
                text = "يرجى إدخال كلمة المرور للمسؤول",
                style = MaterialTheme.typography.bodyMedium,
                color = OnSurfaceVariant,
            )

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("كلمة المرور", color = OnSurfaceVariant) },
                singleLine = true,
                visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
                colors = defaultFieldColors(),
                enabled = !isLoggingIn,
            )

            if (loginError != null) {
                Text(
                    text = loginError,
                    color = Error,
                    style = MaterialTheme.typography.bodySmall,
                )
            }

            Button(
                onClick = { onLogin(password) },
                enabled = password.isNotBlank() && !isLoggingIn,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
            ) {
                if (isLoggingIn) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = OnPrimary,
                        strokeWidth = 2.dp,
                    )
                } else {
                    Text("دخول", color = OnPrimary)
                }
            }
        }
    }
}

@Composable
private fun defaultFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Primary,
    unfocusedBorderColor = Outline,
    focusedTextColor = OnSurface,
    unfocusedTextColor = OnSurface,
)
