package com.zbaymobile

import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.ForegroundInfo
import androidx.work.WorkerParameters
import com.zbaymobile.Utils.Const
import com.zbaymobile.Utils.Utils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.util.concurrent.ThreadLocalRandom

class BackendWorker(context: Context, workerParams: WorkerParameters):
        CoroutineWorker(context, workerParams) {

    private var running: Boolean = false

    companion object {
        init {
            System.loadLibrary("own-native-lib")
            System.loadLibrary("node")
        }
    }

    override suspend fun doWork(): Result {
        /* This is a simple workaround for the problem of firing doWork() method twice
           I see people on the internet have similar problems but it seems like there's no official solution
           https://stackoverflow.com/questions/59724922/workmanager-dowork-getting-fired-twice */
        if (running) return Result.success()
        running = true

        setForeground(createForegroundInfo())

        withContext(Dispatchers.IO) {
            val dataPort        = Utils.getOpenPort(4677)
            val controlPort     = Utils.getOpenPort(9151)
            val socksPort       = Utils.getOpenPort(9050)
            val httpTunnelPort  = Utils.getOpenPort(8050)

            val dataDirectoryPath = Utils.createDirectory(applicationContext)

            val tor = TorManager(applicationContext)
            tor.startTor(controlPort, socksPort, httpTunnelPort)

            // Suspend coroutine until tor fully bootstrapped
            val config =
                tor.awaitBootstrap()

            // Wait for node assets to be copied
            delay(15000)
            startNodeProjectWithArguments("lib/mobileBackendManager.js -d $dataDirectoryPath -p $dataPort -c ${config.controlPort} -s ${config.socksPort} -t ${config.httpTunnelPort} -a ${config.authCookie}")
        }

        // Indicate whether the work finished successfully with the Result
        return Result.success()
    }

    private external fun startNodeWithArguments(
        arguments: Array<String?>?,
        modulesPath: String?
    ): Int?

    @Throws(Exception::class)
    fun startNodeProjectWithArguments(input: String) {
        val args: MutableList<String> = ArrayList(listOf(*input.split(" ").toTypedArray()))

        val projectPath = applicationContext.filesDir.absolutePath + "/" + "nodejs-project"
        val modulesPath = applicationContext.filesDir.absolutePath + "/" + "nodejs-builtin_modules"
        val scriptPath = projectPath + "/" + args[0]

        // Remove script file name from arguments list
        args.removeAt(0)

        val command: MutableList<String> = ArrayList()
        command.add("node")
        command.add(scriptPath)
        command.addAll(args)

        startNodeWithArguments(
            command.toTypedArray(),
            "$projectPath:$modulesPath"
        )
    }

    private fun createForegroundInfo(): ForegroundInfo {
        // This PendingIntent can be used to cancel the worker
        // val intent = WorkManager.getInstance(applicationContext)
        //     .createCancelPendingIntent(id)

        val notification = NotificationCompat.Builder(applicationContext,
            Const.INCOMING_MESSAGES_CHANNEL_ID)
            .setContentTitle("Quiet")
            .setTicker("Quiet")
            .setContentText("Backend is running")
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            // Add the cancel action to the notification which can
            // be used to cancel the worker
            // .addAction(android.R.drawable.ic_delete, "cancel", intent)
            .build()

        val id = ThreadLocalRandom.current().nextInt(0, 9000 + 1)

        return ForegroundInfo(id, notification)
    }
}
