package com.zbaymobile

import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.ForegroundInfo
import androidx.work.WorkerParameters
import com.google.gson.Gson
import com.zbaymobile.Scheme.WebsocketConnectionPayload
import com.zbaymobile.Utils.Const
import com.zbaymobile.Utils.Utils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.torproject.android.binary.TorResourceInstaller
import java.util.concurrent.ThreadLocalRandom

class BackendWorker(context: Context, workerParams: WorkerParameters):
    CoroutineWorker(context, workerParams) {

    private var running: Boolean = false

    private var nodeProject = NodeProjectManager(applicationContext)

    companion object {
        init {
            System.loadLibrary("own-native-lib")
            System.loadLibrary("node")
        }
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

    override suspend fun doWork(): Result {
        /* This is a simple workaround for the problem of firing doWork() method twice
           I see people on the internet have similar problems but it seems like there's no official solution
           https://stackoverflow.com/questions/59724922/workmanager-dowork-getting-fired-twice */
        if (running) return Result.success()
        running = true

        setForeground(createForegroundInfo())

        withContext(Dispatchers.IO) {
            launch {
                // Init nodejs project
                nodeProject.init()
            }

            // Call special port opened by backend to indicate if it is alive or not

            // This is the only port we really need here
            val dataPort        = Utils.getOpenPort(11000)

            // Those we should get inside tor module
            val controlPort     = Utils.getOpenPort(12000)
            val socksPort       = Utils.getOpenPort(13000)
            val httpTunnelPort  = Utils.getOpenPort(14000)

            val dataDirectoryPath = Utils.createDirectory(applicationContext)

            val tor = TorResourceInstaller(applicationContext, applicationContext.filesDir).installResources()
            val torPath = tor.canonicalPath

            val websocketConnectionPayload = WebsocketConnectionPayload(dataPort)
            NotificationModule.handleIncomingEvents(NotificationModule.WEBSOCKET_CONNECTION_CHANNEL, Gson().toJson(websocketConnectionPayload))
            
            startNodeProjectWithArguments("lib/mobileBackendManager.js -d $dataDirectoryPath -p $dataPort -c $controlPort -s $socksPort -t $httpTunnelPort -a $torPath")
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

        val scriptPath = nodeProject.projectPath + '/' + args[0]

        // Remove script file name from arguments list
        args.removeAt(0)

        val command: MutableList<String> = ArrayList()
        command.add("node")
        command.add(scriptPath)
        command.addAll(args)

        nodeProject.waitForInit()

        startNodeWithArguments(
            command.toTypedArray(),
            "${nodeProject.projectPath}/${nodeProject.builtinModulesPath}"
        )
    }

}
