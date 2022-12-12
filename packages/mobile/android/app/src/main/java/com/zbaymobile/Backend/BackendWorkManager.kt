package com.zbaymobile.Backend

import android.content.Context
import androidx.work.*

class BackendWorkManager(private val context: Context) {
    fun enqueueRequests() {
        val backendRequest =
            OneTimeWorkRequestBuilder<BackendWorker>()
                .build()

        val workManager = WorkManager
            .getInstance(context)

        workManager.enqueueUniqueWork("backend_worker", ExistingWorkPolicy.KEEP, backendRequest)
    }
}
