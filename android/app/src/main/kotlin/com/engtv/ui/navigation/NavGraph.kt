package com.engtv.ui.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.engtv.ui.category.CategoryScreen
import com.engtv.ui.developer.DeveloperScreen
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
        composable(
            route = Screen.Home.route,
            enterTransition = { fadeIn(animationSpec = tween(300)) },
            exitTransition = { fadeOut(animationSpec = tween(300)) },
        ) {
            HomeScreen(
                onChannelClick = { channelId ->
                    navController.navigate(Screen.Player.route(channelId))
                },
                onCategoryClick = { categoryId ->
                    navController.navigate(Screen.Category.route(categoryId))
                },
            )
        }

        composable(
            route = Screen.Search.route,
            enterTransition = { fadeIn(animationSpec = tween(300)) },
            exitTransition = { fadeOut(animationSpec = tween(300)) },
        ) {
            SearchScreen(
                onChannelClick = { channelId ->
                    navController.navigate(Screen.Player.route(channelId))
                },
            )
        }

        composable(
            route = Screen.Favorites.route,
            enterTransition = { fadeIn(animationSpec = tween(300)) },
            exitTransition = { fadeOut(animationSpec = tween(300)) },
        ) {
            FavoritesScreen(
                onChannelClick = { channelId ->
                    navController.navigate(Screen.Player.route(channelId))
                },
            )
        }

        composable(
            route = Screen.Settings.route,
            enterTransition = { fadeIn(animationSpec = tween(300)) },
            exitTransition = { fadeOut(animationSpec = tween(300)) },
        ) {
            SettingsScreen(
                onNavigateToDeveloper = {
                    navController.navigate(Screen.Developer.route)
                },
            )
        }

        composable(
            route = Screen.Developer.route,
            enterTransition = { slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Start, animationSpec = tween(300)) },
            exitTransition = { fadeOut(animationSpec = tween(300)) },
            popEnterTransition = { fadeIn(animationSpec = tween(300)) },
            popExitTransition = { slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.Start, animationSpec = tween(300)) },
        ) {
            DeveloperScreen(
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = Screen.Category.route,
            arguments = listOf(navArgument("categoryId") { type = NavType.IntType }),
            enterTransition = { fadeIn(animationSpec = tween(300)) },
            exitTransition = { fadeOut(animationSpec = tween(300)) },
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
            enterTransition = { fadeIn(animationSpec = tween(300)) },
            exitTransition = { fadeOut(animationSpec = tween(300)) },
        ) { backStack ->
            val channelId = backStack.arguments?.getInt("channelId") ?: return@composable
            PlayerScreen(
                channelId = channelId,
                onBack = { navController.popBackStack() },
            )
        }
    }
}
