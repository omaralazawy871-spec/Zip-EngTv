package com.engtv

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.LayoutDirection
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.engtv.ui.navigation.EngTvNavGraph
import com.engtv.ui.navigation.Screen
import com.engtv.ui.theme.Background
import com.engtv.ui.theme.EngTvTheme
import com.engtv.ui.theme.OnSurfaceVariant
import com.engtv.ui.theme.Primary
import com.engtv.ui.theme.Surface
import dagger.hilt.android.AndroidEntryPoint

private data class BottomNavItem(
    val screen: Screen,
    val label: String,
    val icon: ImageVector,
)

private val bottomNavItems = listOf(
    BottomNavItem(Screen.Home,      "الرئيسية",  Icons.Filled.Home),
    BottomNavItem(Screen.Search,    "بحث",       Icons.Filled.Search),
    BottomNavItem(Screen.Favorites, "المفضلة",   Icons.Filled.Favorite),
    BottomNavItem(Screen.Settings,  "الإعدادات", Icons.Filled.Settings),
)

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install splash screen BEFORE super.onCreate() so the system shows it
        // on the very first frame. The theme in AndroidManifest (Theme.EngTv.Starting)
        // provides the splash icon and background color.
        val splashScreen = installSplashScreen()

        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Optionally keep splash on screen while initializing (e.g., preloading data).
        // Currently we dismiss immediately; extend this with a condition if needed:
        // splashScreen.setKeepOnScreenCondition { !viewModel.isReady }

        setContent {
            EngTvTheme {
                // ── Force RTL layout direction for the entire app ─────────
                // The UI language is Arabic, which requires RTL direction.
                // Wrapping here ensures every Compose composable inherits RTL.
                CompositionLocalProvider(
                    androidx.compose.ui.platform.LocalLayoutDirection provides LayoutDirection.Rtl
                ) {
                    val navController = rememberNavController()
                    val backStackEntry by navController.currentBackStackEntryAsState()
                    val currentRoute = backStackEntry?.destination?.route

                    // Player is full-screen — hide bottom navigation bar
                    val showBottomBar = currentRoute != Screen.Player.route

                    Scaffold(
                        modifier = Modifier.fillMaxSize(),
                        containerColor = Background,
                        bottomBar = {
                            if (showBottomBar) {
                                NavigationBar(containerColor = Surface) {
                                    bottomNavItems.forEach { item ->
                                        val selected = currentRoute == item.screen.route
                                        NavigationBarItem(
                                            selected = selected,
                                            onClick = {
                                                if (!selected) {
                                                    navController.navigate(item.screen.route) {
                                                        popUpTo(Screen.Home.route) {
                                                            saveState = true
                                                        }
                                                        launchSingleTop = true
                                                        restoreState = true
                                                    }
                                                }
                                            },
                                            icon = {
                                                Icon(
                                                    imageVector = item.icon,
                                                    contentDescription = item.label,
                                                )
                                            },
                                            label = { Text(item.label) },
                                            colors = NavigationBarItemDefaults.colors(
                                                selectedIconColor   = Primary,
                                                selectedTextColor   = Primary,
                                                unselectedIconColor = OnSurfaceVariant,
                                                unselectedTextColor = OnSurfaceVariant,
                                                indicatorColor      = Surface,
                                            ),
                                        )
                                    }
                                }
                            }
                        },
                    ) { _ ->
                        // Each screen applies its own status-bar / nav-bar padding.
                        // The player screen uses the full window (no padding).
                        EngTvNavGraph(navController = navController)
                    }
                }
            }
        }
    }
}
