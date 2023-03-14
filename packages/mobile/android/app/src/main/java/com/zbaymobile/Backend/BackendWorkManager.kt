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

        // Sometimes workers stuck in queue which causes their overlapping in the future
        // see https://github.com/TryQuiet/quiet/issues/1191
        workManager.cancelAllWork()

        workManager.enqueueUniqueWork("backend_worker", ExistingWorkPolicy.KEEP, backendRequest)
    }

    fun stop() {
        val workManager = WorkManager
            .getInstance(context)

        workManager.cancelAllWork()
    }
}
