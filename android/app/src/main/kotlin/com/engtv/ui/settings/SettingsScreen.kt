package com.engtv.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.engtv.ui.theme.*

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val focusManager = LocalFocusManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .statusBarsPadding()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Text(
            text = "الإعدادات",
            style = MaterialTheme.typography.titleLarge,
            color = OnSurface,
            modifier = Modifier.padding(vertical = 8.dp),
        )

        // ── API Server URL ────────────────────────────────────────────────
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceVariant),
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
                    modifier = Modifier.fillMaxWidth(),
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
                    uiState.savedMessage?.let { msg ->
                        Text(msg, color = Primary, style = MaterialTheme.typography.labelMedium)
                        Spacer(Modifier.width(12.dp))
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

        // ── App Info ──────────────────────────────────────────────────────
        Card(
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceVariant),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("معلومات التطبيق", style = MaterialTheme.typography.titleMedium, color = OnSurface)
                Spacer(Modifier.height(8.dp))
                InfoRow("اسم التطبيق", uiState.appName)
                InfoRow("الإصدار", "1.0.0")
            }
        }
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
