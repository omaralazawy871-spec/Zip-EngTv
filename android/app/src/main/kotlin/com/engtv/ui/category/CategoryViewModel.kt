package com.engtv.ui.category

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.engtv.data.models.Category
import com.engtv.data.repository.CategoryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CategoryUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val category: Category? = null,
)

@HiltViewModel
class CategoryViewModel @Inject constructor(
    private val categoryRepository: CategoryRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(CategoryUiState())
    val uiState: StateFlow<CategoryUiState> = _uiState.asStateFlow()

    fun load(categoryId: Int) {
        viewModelScope.launch {
            _uiState.value = CategoryUiState(isLoading = true)
            categoryRepository.getCategoryWithChannels(categoryId)
                .onSuccess { category ->
                    _uiState.value = CategoryUiState(isLoading = false, category = category)
                }
                .onFailure { error ->
                    _uiState.value = CategoryUiState(isLoading = false, error = error.message)
                }
        }
    }
}
