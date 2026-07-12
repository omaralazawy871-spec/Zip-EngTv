package com.engtv.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.engtv.data.database.entities.WatchHistoryEntity
import com.engtv.data.models.Category
import com.engtv.data.models.Channel
import com.engtv.data.repository.CategoryRepository
import com.engtv.data.repository.ChannelRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val channels: List<Channel> = emptyList(),
    val categories: List<Category> = emptyList(),
    val watchHistory: List<WatchHistoryEntity> = emptyList(),
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val channelRepository: ChannelRepository,
    private val categoryRepository: CategoryRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    val channels = channelRepository.observeChannels()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val categories = categoryRepository.observeCategories()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val watchHistory = channelRepository.observeWatchHistory()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val channelResult = channelRepository.refresh()
            val categoryResult = categoryRepository.refresh()
            val error = channelResult.exceptionOrNull() ?: categoryResult.exceptionOrNull()
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                error = error?.message,
            )
        }
    }
}
