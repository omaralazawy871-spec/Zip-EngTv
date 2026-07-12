package com.engtv.data.repository

import com.engtv.data.api.EngTvApi
import com.engtv.data.database.dao.CategoryDao
import com.engtv.data.database.entities.toEntity
import com.engtv.data.database.entities.toModel
import com.engtv.data.models.Category
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CategoryRepository @Inject constructor(
    private val api: EngTvApi,
    private val categoryDao: CategoryDao,
) {

    fun observeCategories(): Flow<List<Category>> =
        categoryDao.observeVisible().map { list -> list.map { it.toModel() } }

    suspend fun refresh(): Result<List<Category>> = runCatching {
        val categories = api.listCategories()
        categoryDao.upsertAll(categories.map { it.toEntity() })
        categories
    }

    /** Returns a category with its channels (channels come from API, not Room). */
    suspend fun getCategoryWithChannels(id: Int): Result<Category> = runCatching {
        api.getCategory(id)
    }
}
