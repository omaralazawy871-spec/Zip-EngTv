```kotlin
package com.engtv.ui.settings

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
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
                    .semantics {
                        contentDescription = "شعار التطبيق - اضغط 7 مرات لتفعيل وضع المطور"
                    },
            )

            SectionDivider(
                "اتصال الخادم",
                Icons.Filled.Storage
            )

            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = SurfaceVariant
                ),
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
                        label = {
                            Text(
                                "رابط API",
                                color = OnSurfaceVariant
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .semantics {
                                contentDescription = "حقل رابط API"
                            },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Uri,
                            imeAction = ImeAction.Done,
                        ),
                        keyboardActions = KeyboardActions(
                            onDone = {
                                focusManager.clearFocus()
                                viewModel.saveApiUrl()
                            }
                        ),
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

                        AnimatedVisibility(
                            visible = uiState.savedMessage != null,
                            enter = fadeIn(),
                            exit = fadeOut()
                        ) {
                            uiState.savedMessage?.let {
                                Text(
                                    it,
                                    color = Primary,
                                    style = MaterialTheme.typography.labelMedium
                                )
                            }
                        }

                        Button(
                            onClick = {
                                focusManager.clearFocus()
                                viewModel.saveApiUrl()
                            },
                            enabled = !uiState.isSaving,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Primary
                            ),
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

            Spacer(
                Modifier.height(20.dp)
            )

            SectionDivider(
                "معلومات التطبيق",
                Icons.Filled.Info
            )

            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = SurfaceVariant
                ),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {

                    Text(
                        "معلومات التطبيق",
                        style = MaterialTheme.typography.titleMedium,
                        color = OnSurface
                    )

                    Spacer(
                        Modifier.height(8.dp)
                    )

                    InfoRow(
                        "اسم التطبيق",
                        uiState.appName
                    )

                    InfoRow(
                        "الإصدار",
                        "1.0.0"
                    )
                }
            }

            Spacer(
                Modifier.height(32.dp)
            )
        }
    }
}


@Composable
private fun SectionDivider(
    title: String,
    icon: ImageVector
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {

        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = OnSurfaceVariant,
            modifier = Modifier.size(18.dp),
        )

        Spacer(
            Modifier.width(8.dp)
        )

        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = OnSurfaceVariant,
        )
    }
}


@Composable
private fun InfoRow(
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {

        Text(
            label,
            color = OnSurfaceVariant
        )

        Text(
            value,
            color = OnSurface
        )
    }
}
```
