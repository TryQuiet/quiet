package com.zbaymobile

import android.content.Context
import android.util.Log
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LiveData
import androidx.work.*
import java.util.concurrent.TimeUnit

class BackendWorkManager(private val context: Context) {

    fun enqueueRequests() {
        val backendRequest =
            OneTimeWorkRequestBuilder<BackendWorker>()
                .build()

        val workManager = WorkManager
            .getInstance(context)

        workManager.enqueueUniqueWork("backend_worker", ExistingWorkPolicy.KEEP, backendRequest)

//        val status : LiveData<List<WorkInfo>> = workManager.getWorkInfosByTagLiveData("backend")
//        status.observe(lifecycleOwner) { workInfo ->
//            workInfo.forEach {
//                Log.d("QUIET_WORKER", "${it.state}")
//            }
//        }

    }

}
