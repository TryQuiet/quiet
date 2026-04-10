package com.quietmobile.Backend

import android.content.Context
import android.util.Log
import androidx.work.*
import com.google.common.util.concurrent.ListenableFuture
import com.quietmobile.Utils.Const
import java.util.concurrent.ExecutionException

class BackendWorkManager(private val context: Context) {
    companion object {
        private const val TAG = "BackendWorkManager"
        private const val UNIQUE_WORK_NAME = "backend_worker"
    }

    fun enqueueRequests() {
        val workManager = WorkManager
            .getInstance(context)

        val statuses: ListenableFuture<List<WorkInfo>> =
            workManager.getWorkInfosByTag(Const.WORKER_TAG)

        var running = false
        var enqueued = false

        try {
            val workInfoList: List<WorkInfo> = statuses.get()
            for (workInfo in workInfoList) {
                running = running || workInfo.state == WorkInfo.State.RUNNING
                enqueued = enqueued || workInfo.state == WorkInfo.State.ENQUEUED
            }
        } catch (e: ExecutionException) {
            Log.e(TAG, "Failed to inspect backend worker state", e)
        } catch (e: InterruptedException) {
            Log.e(TAG, "Interrupted while inspecting backend worker state", e)
            Thread.currentThread().interrupt()
        }

        if (BackendWorker.isShutdownInProgress()) {
            Log.i(TAG, "Skipping enqueueRequests because shutdown is in progress: " + BackendWorker.lifecycleSummary())
            return
        }

        if (BackendWorker.isNodeRuntimeActive() || BackendWorker.isStartupInProgress()) {
            Log.i(TAG, "Skipping enqueueRequests because backend lifecycle is active: " + BackendWorker.lifecycleSummary())
            return
        }

        if (running || enqueued) {
            Log.i(TAG, "Skipping enqueueRequests because matching work already exists running=" + running + " enqueued=" + enqueued)
            return
        }

        val backendRequest =
            OneTimeWorkRequestBuilder<BackendWorker>()
                .addTag(Const.WORKER_TAG)
                .build()

        Log.i(TAG, "Enqueuing backend worker: " + BackendWorker.lifecycleSummary())
        workManager.enqueueUniqueWork(UNIQUE_WORK_NAME, ExistingWorkPolicy.KEEP, backendRequest)
    }

    fun stop() {
        val workManager = WorkManager
            .getInstance(context)

        Log.i(TAG, "Stopping backend worker: " + BackendWorker.lifecycleSummary())
        try {
            BackendWorker.requestNodeShutdown()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to request backend shutdown", e)
        }

        workManager.cancelUniqueWork(UNIQUE_WORK_NAME)
        workManager.cancelAllWorkByTag(Const.WORKER_TAG)
    }
}
