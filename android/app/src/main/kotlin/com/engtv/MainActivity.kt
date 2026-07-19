package com.engtv

import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.LayoutDirection
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.engtv.data.models.UserPreferences
import com.engtv.data.repository.UserPreferencesRepository
import com.engtv.ui.navigation.EngTvNavGraph
import com.engtv.ui.navigation.Screen
import com.engtv.ui.theme.Background
import com.engtv.ui.theme.EngTvTheme
import com.engtv.ui.theme.OnSurfaceVariant
import com.engtv.ui.theme.Primary
import com.engtv.ui.theme.Surface
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

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

    @Inject lateinit var userPreferencesRepository: UserPreferencesRepository

    private var isSplashReady = false

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)

        splashScreen.setKeepOnScreenCondition { !isSplashReady }

        enableEdgeToEdge()

        setContent {
            val preferences by userPreferencesRepository.preferences
                .collectAsState(initial = UserPreferences())
            EngTvTheme(themeMode = preferences.themeMode) {
                CompositionLocalProvider(
                    androidx.compose.ui.platform.LocalLayoutDirection provides LayoutDirection.Rtl
                ) {
                    val navController = rememberNavController()
                    val backStackEntry by navController.currentBackStackEntryAsState()
                    val currentRoute = backStackEntry?.destination?.route

                    val showBottomBar = currentRoute != Screen.Player.route

                    var showBrandAnimation by remember { mutableStateOf(true) }

                    LaunchedEffect(Unit) {
                        isSplashReady = true
                    }

                    Box(modifier = Modifier.fillMaxSize()) {
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
                            EngTvNavGraph(navController = navController)
                        }

                        if (showBrandAnimation) {
                            BrandAnimation(onFinished = { showBrandAnimation = false })
                        }
                    }
                }
            }
        }
    }

    override fun onPictureInPictureModeChanged(
        isInPictureInPictureMode: Boolean,
        newConfig: Configuration,
    ) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
    }
}

@Composable
private fun BrandAnimation(onFinished: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition()
    val alpha by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
    )

    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(1600)
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Transparent)
            .alpha(alpha),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "EngTv",
            style = MaterialTheme.typography.headlineLarge,
            color = Primary.copy(alpha = 0.3f),
        )
    }
}
