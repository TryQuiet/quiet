package com.quietmobile.Backend;

import android.content.Context
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.ForegroundInfo
import androidx.work.WorkerParameters
import com.google.gson.Gson
import com.quietmobile.BuildConfig
import com.quietmobile.Communication.CommunicationModule
import com.quietmobile.Notification.NotificationHandler
import com.quietmobile.R
import com.quietmobile.Scheme.WebsocketConnectionPayload
import com.quietmobile.Utils.Const
import com.quietmobile.Utils.Const.WEBSOCKET_CONNECTION_DELAY
import com.quietmobile.Utils.Utils
import com.quietmobile.Utils.isAppOnForeground
import io.socket.client.IO
import io.socket.emitter.Emitter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject
import org.torproject.android.binary.TorResourceInstaller
import java.util.concurrent.ThreadLocalRandom


class BackendWorker(private val context: Context, workerParams: WorkerParameters) : CoroutineWorker(context, workerParams) {

    private var running: Boolean = false

    private var nodeProject = NodeProjectManager(applicationContext)

    // Use dedicated class for composing and displaying notifications
    private lateinit var notificationHandler: NotificationHandler

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

        val title = if (!BuildConfig.DEBUG) {
            applicationContext.getString(R.string.app_name)
        } else {
            applicationContext.getString(R.string.debug_app_name)
        }

        val icon = if (!BuildConfig.DEBUG) {
            R.drawable.ic_notification
        } else {
            R.drawable.ic_notification_dev
        }

        val notification = NotificationCompat.Builder(applicationContext,
            Const.FOREGROUND_SERVICE_NOTIFICATION_CHANNEL_ID)
            .setContentTitle(title)
            .setTicker("Quiet")
            .setContentText("Backend is running")
            .setSmallIcon(icon)
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
            // Get and store data port for usage in methods across the app
            val dataPort = Utils.getOpenPort(11000)

            // Init nodejs project
            launch {
                nodeProject.init()
            }

            launch {
                notificationHandler = NotificationHandler(context)
                subscribePushNotifications(dataPort)
            }

            launch {
                /*
                 * Wait for CommunicationModule to be initialized with reactContext
                 * (there's no callback we can use for that purpose).
                 *
                 * Code featured below suspends nothing but the websocket connection
                 * and it doesn't affect anything besides that.
                 *
                 * In any case, websocket won't connect until data server starts listening
                 */
                delay(WEBSOCKET_CONNECTION_DELAY)
                startWebsocketConnection(dataPort)
            }

            val dataPath = Utils.createDirectory(context)

            val tor = TorResourceInstaller(context, context.filesDir).installResources()
            val torBinary = tor.canonicalPath

            val platform = "mobile"

            startNodeProjectWithArguments("bundle.cjs --torBinary $torBinary --dataPath $dataPath --dataPort $dataPort --platform $platform")
        }

        println("FINISHING BACKEND WORKER")

        CommunicationModule.handleIncomingEvents(
            CommunicationModule.BACKEND_CLOSED_CHANNEL,
            "",
            ""
        )

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

        // Do not continue if nodejs project codebase is not yet accessible
        nodeProject.waitForInit()

        startNodeWithArguments(
            command.toTypedArray(),
            "${nodeProject.projectPath}/${nodeProject.builtinModulesPath}"
        )
    }

    private fun subscribePushNotifications(port: Int) {
        val webSocketClient = IO.socket("http://localhost:$port")
        // Listen for events sent from nodejs
        webSocketClient.on("pushNotification", onPushNotification)
        // Client won't connect by itself (`connect()` method has to be called manually)
        webSocketClient.connect()
    }

    private val onPushNotification =
        Emitter.Listener { args ->
            var message = ""
            var username = ""
            try {
                val data = args[0] as JSONObject
                message = data.getString("message")
                username = data.getString("username")
            } catch (e: JSONException) {
                Log.e("ON_PUSH_NOTIFICATION", "unexpected JSON exception", e)
            }
            if (context.isAppOnForeground()) return@Listener // If application is in foreground, let redux be in charge of displaying notifications
            notificationHandler.notify(message, username)
        }

    private fun startWebsocketConnection(port: Int) {
        Log.d("WEBSOCKET CONNECTION", "Starting on $port")
        // Proceed only if data port is defined
        val websocketConnectionPayload = WebsocketConnectionPayload(port)
        CommunicationModule.handleIncomingEvents(
            CommunicationModule.WEBSOCKET_CONNECTION_CHANNEL,
            Gson().toJson(websocketConnectionPayload),
            "" // Empty extras
        )
    }
}
