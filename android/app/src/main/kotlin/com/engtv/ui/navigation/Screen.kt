package com.engtv.ui.navigation

sealed class Screen(val route: String) {
    data object Home      : Screen("home")
    data object Search    : Screen("search")
    data object Favorites : Screen("favorites")
    data object Settings  : Screen("settings")

    data object Category  : Screen("category/{categoryId}") {
        fun route(categoryId: Int) = "category/$categoryId"
    }

    data object Player    : Screen("player/{channelId}") {
        fun route(channelId: Int) = "player/$channelId"
    }
}
