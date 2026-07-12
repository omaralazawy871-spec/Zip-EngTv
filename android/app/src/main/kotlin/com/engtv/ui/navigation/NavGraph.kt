package com.engtv.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.engtv.ui.category.CategoryScreen
import com.engtv.ui.favorites.FavoritesScreen
import com.engtv.ui.home.HomeScreen
import com.engtv.ui.player.PlayerScreen
import com.engtv.ui.search.SearchScreen
import com.engtv.ui.settings.SettingsScreen

@Composable
fun EngTvNavGraph(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route,
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onChannelClick = { channelId ->
                    navController.navigate(Screen.Player.route(channelId))
                },
                onCategoryClick = { categoryId ->
                    navController.navigate(Screen.Category.route(categoryId))
                },
            )
        }

        composable(Screen.Search.route) {
            SearchScreen(
                onChannelClick = { channelId ->
                    navController.navigate(Screen.Player.route(channelId))
                },
            )
        }

        composable(Screen.Favorites.route) {
            FavoritesScreen(
                onChannelClick = { channelId ->
                    navController.navigate(Screen.Player.route(channelId))
                },
            )
        }

        composable(Screen.Settings.route) {
            SettingsScreen()
        }

        composable(
            route = Screen.Category.route,
            arguments = listOf(navArgument("categoryId") { type = NavType.IntType }),
        ) { backStack ->
            val categoryId = backStack.arguments?.getInt("categoryId") ?: return@composable
            CategoryScreen(
                categoryId = categoryId,
                onChannelClick = { channelId ->
                    navController.navigate(Screen.Player.route(channelId))
                },
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = Screen.Player.route,
            arguments = listOf(navArgument("channelId") { type = NavType.IntType }),
        ) { backStack ->
            val channelId = backStack.arguments?.getInt("channelId") ?: return@composable
            PlayerScreen(
                channelId = channelId,
                onBack = { navController.popBackStack() },
            )
        }
    }
}
