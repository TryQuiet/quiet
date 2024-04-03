package com.quietmobile

import android.content.Context
import androidx.work.*
import com.google.common.util.concurrent.ListenableFuture
import com.quietmobile.Utils.Const
import java.util.concurrent.ExecutionException

class BackendWorkManager(private val context: Context) {
    fun enqueueRequests() {
        val workManager = WorkManager
            .getInstance(context)

        val statuses: ListenableFuture<List<WorkInfo>> = workManager.getWorkInfosByTag(Const.WORKER_TAG)

        var running  = false
        var enqueued = false

        try {
            val workInfoList: List<WorkInfo> = statuses.get()
            for (workInfo in workInfoList) {
                running  = workInfo.state == WorkInfo.State.RUNNING
                enqueued = workInfo.state == WorkInfo.State.ENQUEUED
            }
        } catch (e: ExecutionException) {
            e.printStackTrace()
        } catch (e: InterruptedException) {
            e.printStackTrace()
        }

        if(!running) {
            if(enqueued) {
                stop()
            }

            val backendRequest =
                OneTimeWorkRequestBuilder<BackendWorker>()
                    .addTag(Const.WORKER_TAG)
                    .build()

            workManager.enqueueUniqueWork("backend_worker", ExistingWorkPolicy.KEEP, backendRequest)
        }
    }

    fun stop() {
        val workManager = WorkManager
            .getInstance(context)

        workManager.cancelAllWorkByTag(Const.WORKER_TAG)
    }
}
