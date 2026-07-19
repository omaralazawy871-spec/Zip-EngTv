package com.engtv.ui.settings

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Brightness6
import androidx.compose.material.icons.filled.DeveloperMode
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.engtv.data.models.AppLanguage
import com.engtv.data.models.PlayerType
import com.engtv.data.models.ThemeMode
import com.engtv.ui.theme.*

@Composable
fun SettingsScreen(
    onNavigateToDeveloper: () -> Unit = {},
    viewModel: SettingsViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val focusManager = LocalFocusManager.current
    val context = LocalContext.current

    val exportLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("application/json"),
    ) { uri: Uri? ->
        if (uri != null) viewModel.exportBackup(uri)
    }

    val importLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument(),
    ) { uri: Uri? ->
        if (uri != null) viewModel.importBackup(uri)
    }

    LaunchedEffect(uiState.backupMessage, uiState.backupError) {
        if (uiState.backupMessage != null || uiState.backupError != null) {
            kotlinx.coroutines.delay(4000)
            viewModel.clearBackupMessages()
        }
    }

    LaunchedEffect(uiState.developerJustActivated) {
        if (uiState.developerJustActivated) {
            Toast.makeText(context, "وضع المطور مفعل", Toast.LENGTH_SHORT).show()
            viewModel.clearDeveloperJustActivated()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .statusBarsPadding(),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Text(
                text = "الإعدادات",
                style = MaterialTheme.typography.titleLarge,
                color = OnSurface,
                modifier = Modifier
                    .padding(vertical = 8.dp)
                    .clickable { viewModel.onLogoTap() }
                    .semantics { contentDescription = "شعار التطبيق - اضغط 7 مرات لتفعيل وضع المطور" },
            )

            // ── API Server URL ────────────────────────────────────────────────
            SectionDivider("اتصال الخادم", Icons.Filled.Storage)

            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceVariant),
                modifier = Modifier.animateContentSize(),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(
                        "عنوان الخادم (API)",
                        style = MaterialTheme.typography.titleMedium,
                        color = OnSurface,
                    )
                    Text(
                        "أدخل عنوان API الخاص بخادم EngTv المنشور",
                        style = MaterialTheme.typography.bodyMedium,
                        color = OnSurfaceVariant,
                    )
                    OutlinedTextField(
                        value = uiState.apiUrl,
                        onValueChange = viewModel::onApiUrlChange,
                        label = { Text("رابط API", color = OnSurfaceVariant) },
                        placeholder = { Text("https://your-backend.replit.app/api/", color = OnSurfaceVariant) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .semantics { contentDescription = "حقل رابط API" },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Uri,
                            imeAction = ImeAction.Done,
                        ),
                        keyboardActions = KeyboardActions(onDone = {
                            focusManager.clearFocus()
                            viewModel.saveApiUrl()
                        }),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Primary,
                            unfocusedBorderColor = Outline,
                            focusedTextColor = OnSurface,
                            unfocusedTextColor = OnSurface,
                        ),
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        AnimatedVisibility(visible = uiState.savedMessage != null, enter = fadeIn(), exit = fadeOut()) {
                            uiState.savedMessage?.let { msg ->
                                Text(msg, color = Primary, style = MaterialTheme.typography.labelMedium)
                                Spacer(Modifier.width(12.dp))
                            }
                        }
                        Button(
                            onClick = {
                                focusManager.clearFocus()
                                viewModel.saveApiUrl()
                            },
                            enabled = !uiState.isSaving,
                            colors = ButtonDefaults.buttonColors(containerColor = Primary),
                        ) {
                            if (uiState.isSaving) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    color = OnPrimary,
                                    strokeWidth = 2.dp,
                                )
                            } else {
                                Text("حفظ")
                            }
                        }
                    }
                }
            }

            // ── Theme Selector ─────────────────────────────────────────────────
            SectionDivider("المظهر", Icons.Filled.Brightness6)

            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceVariant),
                modifier = Modifier.animateContentSize(),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "المظهر",
                        style = MaterialTheme.typography.titleMedium,
                        color = OnSurface,
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        ThemeModeOption(
                            text = "النظام",
                            selected = uiState.themeMode == ThemeMode.SYSTEM,
                            onClick = { viewModel.setThemeMode(ThemeMode.SYSTEM) },
                            modifier = Modifier.weight(1f),
                        )
                        ThemeModeOption(
                            text = "فاتح",
                            selected = uiState.themeMode == ThemeMode.LIGHT,
                            onClick = { viewModel.setThemeMode(ThemeMode.LIGHT) },
                            modifier = Modifier.weight(1f),
                        )
                        ThemeModeOption(
                            text = "داكن",
                            selected = uiState.themeMode == ThemeMode.DARK,
                            onClick = { viewModel.setThemeMode(ThemeMode.DARK) },
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }

            // ── Language Selector ──────────────────────────────────────────────
            SectionDivider("اللغة", Icons.Filled.Language)

            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceVariant),
                modifier = Modifier.animateContentSize(),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "اللغة",
                        style = MaterialTheme.typography.titleMedium,
                        color = OnSurface,
                    )
                    Spacer(Modifier.height(8.dp))
                    RadioOption(
                        text = "العربية",
                        selected = uiState.language == AppLanguage.ARABIC,
                        onClick = { viewModel.setLanguage(AppLanguage.ARABIC) },
                    )
                    RadioOption(
                        text = "English",
                        selected = uiState.language == AppLanguage.ENGLISH,
                        onClick = { viewModel.setLanguage(AppLanguage.ENGLISH) },
                    )
                }
            }

            // ── Playback Preferences ──────────────────────────────────────────
            SectionDivider("تفضيلات التشغيل", Icons.Filled.PlayCircle)

            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceVariant),
                modifier = Modifier.animateContentSize(),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "تفضيلات التشغيل",
                        style = MaterialTheme.typography.titleMedium,
                        color = OnSurface,
                    )
                    Spacer(Modifier.height(8.dp))

                    SwitchRow(
                        label = "التشغيل التلقائي لآخر قناة",
                        checked = uiState.autoPlayLastChannel,
                        onCheckedChange = viewModel::setAutoPlayLast,
                    )
                    Spacer(Modifier.height(4.dp))
                    SwitchRow(
                        label = "تذكر جودة البث",
                        checked = uiState.rememberQuality,
                        onCheckedChange = viewModel::setRememberQuality,
                    )
                    Spacer(Modifier.height(12.dp))
                    Text(
                        "المشغل الافتراضي",
                        style = MaterialTheme.typography.bodyMedium,
                        color = OnSurfaceVariant,
                    )
                    Spacer(Modifier.height(4.dp))
                    RadioOption(
                        text = "المشغل الداخلي",
                        selected = uiState.defaultPlayer == PlayerType.INTERNAL,
                        onClick = { viewModel.setDefaultPlayer(PlayerType.INTERNAL) },
                    )
                    RadioOption(
                        text = "مشغل خارجي",
                        selected = uiState.defaultPlayer == PlayerType.EXTERNAL,
                        onClick = { viewModel.setDefaultPlayer(PlayerType.EXTERNAL) },
                    )
                }
            }

            // ── Backup ────────────────────────────────────────────────────────
            SectionDivider("النسخ الاحتياطي", Icons.Filled.Storage)

            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceVariant),
                modifier = Modifier.animateContentSize(),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "النسخ الاحتياطي",
                        style = MaterialTheme.typography.titleMedium,
                        color = OnSurface,
                    )
                    Text(
                        "تصدير أو استيراد بيانات القنوات والمفضلة وسجل المشاهدة",
                        style = MaterialTheme.typography.bodySmall,
                        color = OnSurfaceVariant,
                    )
                    Spacer(Modifier.height(12.dp))

                    AnimatedVisibility(visible = uiState.backupMessage != null, enter = fadeIn(), exit = fadeOut()) {
                        uiState.backupMessage?.let { msg ->
                            Text(msg, color = Primary, style = MaterialTheme.typography.bodyMedium)
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                    AnimatedVisibility(visible = uiState.backupError != null, enter = fadeIn(), exit = fadeOut()) {
                        uiState.backupError?.let { err ->
                            Text(err, color = Error, style = MaterialTheme.typography.bodyMedium)
                            Spacer(Modifier.height(8.dp))
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        OutlinedButton(
                            onClick = { exportLauncher.launch("engtv_backup.json") },
                            enabled = !uiState.isExporting && !uiState.isImporting,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary),
                        ) {
                            if (uiState.isExporting) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    color = Primary,
                                    strokeWidth = 2.dp,
                                )
                            } else {
                                Text("تصدير نسخة احتياطية")
                            }
                        }
                        Button(
                            onClick = { importLauncher.launch(arrayOf("*/*")) },
                            enabled = !uiState.isExporting && !uiState.isImporting,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Primary),
                        ) {
                            if (uiState.isImporting) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    color = OnPrimary,
                                    strokeWidth = 2.dp,
                                )
                            } else {
                                Text("استيراد نسخة احتياطية")
                            }
                        }
                    }
                }
            }

            // ── Developer Mode Card ───────────────────────────────────────────
            AnimatedVisibility(
                visible = uiState.isDeveloperMode,
                enter = fadeIn(),
                exit = fadeOut(),
            ) {
                Column {
                    SectionDivider("وضع المطور", Icons.Filled.DeveloperMode)
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceVariant),
                        modifier = Modifier
                            .animateContentSize()
                            .clickable(onClick = onNavigateToDeveloper)
                            .semantics { contentDescription = "فتح شاشة المطور" },
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    "وضع المطور",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Primary,
                                )
                                Text(
                                    "إدارة المصادر وسجل المزامنة",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = OnSurfaceVariant,
                                )
                            }
                            Icon(
                                imageVector = Icons.Filled.DeveloperMode,
                                contentDescription = null,
                                tint = Primary,
                                modifier = Modifier.size(32.dp),
                            )
                        }
                    }
                }
            }

            // ── App Info ──────────────────────────────────────────────────────
            SectionDivider("معلومات التطبيق", Icons.Filled.Info)

            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceVariant),
                modifier = Modifier.animateContentSize(),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("معلومات التطبيق", style = MaterialTheme.typography.titleMedium, color = OnSurface)
                    Spacer(Modifier.height(8.dp))
                    InfoRow("اسم التطبيق", uiState.appName)
                    InfoRow("الإصدار", "1.0.0")
                }
            }

            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun SectionDivider(title: String, icon: ImageVector) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = OnSurfaceVariant,
            modifier = Modifier.size(18.dp),
        )
        Spacer(Modifier.width(8.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = OnSurfaceVariant,
        )
    }
}

@Composable
private fun ThemeModeOption(text: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier
            .clickable(onClick = onClick)
            .semantics { contentDescription = "وضع المظهر: $text" },
        shape = RoundedCornerShape(8.dp),
        color = if (selected) Primary.copy(alpha = 0.15f) else SurfaceContainer,
    ) {
        Column(
            modifier = Modifier.padding(vertical = 12.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            RadioButton(
                selected = selected,
                onClick = onClick,
                colors = RadioButtonDefaults.colors(selectedColor = Primary, unselectedColor = OnSurfaceVariant),
            )
            Text(
                text = text,
                style = MaterialTheme.typography.bodySmall,
                color = if (selected) Primary else OnSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun RadioOption(text: String, selected: Boolean, onClick: () -> Unit) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 4.dp)
            .semantics { contentDescription = text },
    ) {
        RadioButton(
            selected = selected,
            onClick = onClick,
            colors = RadioButtonDefaults.colors(selectedColor = Primary, unselectedColor = OnSurfaceVariant),
        )
        Spacer(Modifier.width(8.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = OnSurface,
        )
    }
}

@Composable
private fun SwitchRow(label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .semantics { contentDescription = label },
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = OnSurface,
        )
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(checkedTrackColor = Primary, checkedThumbColor = OnPrimary),
        )
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, color = OnSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
        Text(value, color = OnSurface, style = MaterialTheme.typography.bodyMedium)
    }
}
