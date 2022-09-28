package com.zbaymobile

import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.ForegroundInfo
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.zbaymobile.Utils.Const
import java.util.*
import java.util.concurrent.ThreadLocalRandom

class BackendWorker(context: Context, workerParams: WorkerParameters):
        CoroutineWorker(context, workerParams) {

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as
                NotificationManager

    companion object {
        init {
            System.loadLibrary("nodejs-mobile-react-native-native-lib")
            System.loadLibrary("node")
        }
    }

    override suspend fun doWork(): Result {

        setForeground(createForegroundInfo())

        val sharedPref = applicationContext.getSharedPreferences(
            applicationContext.getString(R.string.config_preferences), Context.MODE_PRIVATE)

        val dataPort = sharedPref.getInt(applicationContext.getString(R.string.data_port), -1)
        val dataDirectoryPath = sharedPref.getString(applicationContext.getString(R.string.data_directory_path), "dataDirectoryPath")
        val httpTunnelPort = sharedPref.getInt(applicationContext.getString(R.string.httpTunnelPort), -1)
        val socksPort = sharedPref.getInt(applicationContext.getString(R.string.socksPort), -1)
        val controlPort = sharedPref.getInt(applicationContext.getString(R.string.controlPort), -1)
        val authCookie = sharedPref.getString(applicationContext.getString(R.string.authCookie), "authCookie")

        startNodeProjectWithArguments("lib/mobileBackendManager.js -d $dataDirectoryPath -p $dataPort -t $httpTunnelPort -s $socksPort -c $controlPort -a $authCookie")

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

        Thread {
            startNodeWithArguments(
                command.toTypedArray(),
                "$projectPath:$modulesPath"
            )
        }.start()
    }

    private fun createForegroundInfo(): ForegroundInfo {
        // This PendingIntent can be used to cancel the worker
        val intent = WorkManager.getInstance(applicationContext)
            .createCancelPendingIntent(id)

        val notification = NotificationCompat.Builder(applicationContext,
            Const.INCOMING_MESSAGES_CHANNEL_ID)
            .setContentTitle("Quiet")
            .setTicker("Quiet")
            .setContentText("Backend is running")
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            // Add the cancel action to the notification which can
            // be used to cancel the worker
            .addAction(android.R.drawable.ic_delete, "cancel", intent)
            .build()

        val id = ThreadLocalRandom.current().nextInt(0, 9000 + 1)

        return ForegroundInfo(id, notification)
    }
}
