package com.zbaymobile

import android.content.Context
import android.util.Log
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LiveData
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequest
import androidx.work.WorkInfo
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

class BackendWorkManager(private val context: Context) {

    fun enqueueRequests() {
//        val backendRequest =
//            PeriodicWorkRequest.Builder(BackendWorker::class.java, 15, TimeUnit.MINUTES)
//                .addTag("backend")
//                .build()

        val backendRequest =
            OneTimeWorkRequestBuilder<BackendWorker>()
                .addTag("backend")
                .build()

        val workManager = WorkManager
            .getInstance(context)

        workManager.enqueue(backendRequest)

//        val status : LiveData<List<WorkInfo>> = workManager.getWorkInfosByTagLiveData("backend")
//        status.observe(lifecycleOwner) { workInfo ->
//            workInfo.forEach {
//                Log.d("QUIET_WORKER", "${it.state}")
//            }
//        }

    }

}
