package com.quietmobile.Backend

import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.ForegroundInfo
import androidx.work.WorkerParameters
import com.goterl.lazysodium.LazySodiumAndroid
import com.goterl.lazysodium.SodiumAndroid
import com.quietmobile.BuildConfig
import com.quietmobile.Communication.CommunicationModule
import com.quietmobile.MainApplication
import com.quietmobile.Notification.NotificationHandler
import com.quietmobile.R
import com.quietmobile.Utils.Const
import com.quietmobile.Utils.Utils
import com.quietmobile.Utils.isAppOnForeground
import io.socket.client.IO
import io.socket.emitter.Emitter
import java.util.concurrent.ThreadLocalRandom
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject

class BackendWorker(private val context: Context, workerParams: WorkerParameters) :
    CoroutineWorker(context, workerParams) {

    private var running: Boolean = false

    private var nodeProject = NodeProjectManager(applicationContext)

    private var sodium = LazySodiumAndroid(SodiumAndroid())

    // Use dedicated class for composing and displaying notifications
    private lateinit var notificationHandler: NotificationHandler

    companion object {
        private const val TAG = "BackendWorker"

        init {
            System.loadLibrary("own-native-lib")
            System.loadLibrary("node")
            System.loadLibrary("tor")
        }

        @Volatile
        private var startupInProgress: Boolean = false

        @Volatile
        private var shutdownInProgress: Boolean = false

        @Volatile
        private var nodeRuntimeActive: Boolean = false

        /** Populated once in `doWork()`; used later by the JNI‑callback handshake */
        @JvmStatic
        var socketIOSecret: String = ""

        /** Kotlin → C++ bridge for sending messages to Node (see `own-native-lib.cpp`) */
        @JvmStatic
        external fun sendMessageToNodeChannel(channelName: String, message: String)

        @JvmStatic
        fun requestNodeShutdown() {
            synchronized(this) {
                shutdownInProgress = true
            }
            Log.i(TAG, "Requesting Node shutdown: " + lifecycleSummary())
            val response =
                JSONObject()
                    .put("event", "shutdown")
                    .put("payload", org.json.JSONArray().toString())
                    .toString()
            sendMessageToNodeChannel("_EVENTS_", response)
        }

        @JvmStatic
        fun isStartupInProgress(): Boolean = startupInProgress

        @JvmStatic
        fun isShutdownInProgress(): Boolean = shutdownInProgress

        @JvmStatic
        fun isNodeRuntimeActive(): Boolean = nodeRuntimeActive

        @JvmStatic
        @Synchronized
        fun lifecycleSummary(): String {
            return "startupInProgress=" + startupInProgress +
                ", shutdownInProgress=" + shutdownInProgress +
                ", nodeRuntimeActive=" + nodeRuntimeActive
        }

        @JvmStatic
        @Synchronized
        fun beginStartup(): Boolean {
            if (shutdownInProgress || startupInProgress || nodeRuntimeActive) {
                return false
            }
            startupInProgress = true
            return true
        }

        @JvmStatic
        @Synchronized
        fun markBackendReady() {
            startupInProgress = false
            shutdownInProgress = false
            nodeRuntimeActive = true
        }

        @JvmStatic
        @Synchronized
        fun markBackendClosed() {
            startupInProgress = false
            shutdownInProgress = false
            nodeRuntimeActive = false
            socketIOSecret = ""
        }

        @JvmStatic
        @Synchronized
        fun forceRecoverForForegroundStart() {
            if (nodeRuntimeActive) {
                Log.i(TAG, "Skipping lifecycle recovery because backend is already active: " + lifecycleSummary())
                return
            }

            startupInProgress = false
            shutdownInProgress = false
            socketIOSecret = ""
            Log.i(TAG, "Recovered backend lifecycle for foreground start: " + lifecycleSummary())
        }

        /**
         * Called from native code (`rcv_message` in `own-native-lib.cpp`) whenever Node posts over
         * rn‑bridge.
         */
        @JvmStatic
        @Suppress("unused") // used in C++, but Android Studio can't see that
        fun handleNodeMessages(channelName: String, msg: String?) {
            if (channelName == "_EVENTS_" && msg != null) {
                try {
                    val envelope = JSONObject(msg)
                    val event = envelope.optString("event", "")
                    val payloadStr = envelope.optString("payload", "")
                    if (event == "message" && payloadStr.isNotEmpty()) {
                        val payloadArr = org.json.JSONArray(payloadStr)
                        if (payloadArr.length() > 0 && payloadArr.getString(0) == "readyForSecret"
                        ) {
                            val nonce =
                                if (payloadArr.length() > 1) payloadArr.getString(1) else null
                            if (nonce != null) {
                                val response =
                                    JSONObject()
                                        .put("event", "secret")
                                        .put(
                                            "payload",
                                            JSONObject()
                                                .put("type", "set-socket-secret")
                                                .put("secret", socketIOSecret)
                                                .put("nonce", nonce)
                                        )
                                        .toString()
                                sendMessageToNodeChannel("_EVENTS_", response)
                            }
                        }
                    } else if (event == "backendReady") {
                        markBackendReady()
                        Log.i(TAG, "Backend reported ready: " + lifecycleSummary())
                        CommunicationModule.handleIncomingEvents(CommunicationModule.BACKEND_READY_CHANNEL, "", "")
                    } else if (event == "backendClosed") {
                        markBackendClosed()
                        Log.i(TAG, "Backend reported closed: " + lifecycleSummary())
                        CommunicationModule.handleIncomingEvents(CommunicationModule.BACKEND_CLOSED_CHANNEL, "", "")
                    } else {
                        Log.d(
                            TAG,
                            "Received unhandled event: $event with payload: $payloadStr"
                        )
                    }
                } catch (_: JSONException) {
                    Log.d(
                        TAG,
                        "handleNodeMessages: JSONException while parsing message from backend"
                    )
                }
            }
        }
    }

    private fun createForegroundInfo(): ForegroundInfo {

        // This PendingIntent can be used to cancel the worker
        // val intent = WorkManager.getInstance(applicationContext)
        //     .createCancelPendingIntent(id)

        val title =
            if (!BuildConfig.DEBUG) {
                applicationContext.getString(R.string.app_name)
            } else {
                applicationContext.getString(R.string.debug_app_name)
            }

        val icon =
            if (!BuildConfig.DEBUG) {
                R.drawable.ic_notification
            } else {
                R.drawable.ic_notification_dev
            }

        val notification =
            NotificationCompat.Builder(
                applicationContext,
                Const.FOREGROUND_SERVICE_NOTIFICATION_CHANNEL_ID
            )
                .setContentTitle(title)
                .setTicker("Quiet")
                .setContentText("Backend is running")
                .setSmallIcon(icon)
                // Add the cancel action to the notification which can
                // be used to cancel the worker
                // .addAction(android.R.drawable.ic_delete, "cancel", intent)
                .build()

        val id = ThreadLocalRandom.current().nextInt(0, 9000 + 1)

        val foregroundInfo: ForegroundInfo =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ForegroundInfo(id, notification, FOREGROUND_SERVICE_TYPE_DATA_SYNC)
            } else {
                ForegroundInfo(id, notification)
            }

        return foregroundInfo
    }

    override suspend fun doWork(): Result {
        /* This is a simple workaround for the problem of firing doWork() method twice
        I see people on the internet have similar problems but it seems like there's no official solution
        https://stackoverflow.com/questions/59724922/workmanager-dowork-getting-fired-twice */
        if (running) return Result.success()
        running = true

        if (!beginStartup()) {
            Log.i(TAG, "Skipping backend startup because lifecycle transition is in flight: " + lifecycleSummary())
            return Result.success()
        }

        setForegroundAsync(createForegroundInfo())

        withContext(Dispatchers.IO) {

            // Get and store data port for usage in methods across the app
            val socketPort = Utils.getOpenPort(11000)

            val socketIOSecretBytes = sodium.randomBytesBuf(32)
            socketIOSecret = sodium.sodiumBin2Hex(socketIOSecretBytes)

            (applicationContext as MainApplication).socketPort = socketPort
            (applicationContext as MainApplication).socketIOSecret = socketIOSecret

            // Init nodejs project
            launch { nodeProject.init() }

            launch {
                notificationHandler = NotificationHandler(context)
                subscribePushNotifications(socketPort, socketIOSecret)
            }

            val dataPath = Utils.createDirectory(context)

            val appInfo =
                applicationContext.packageManager.getApplicationInfo(context.packageName, 0)
            val torBinary = appInfo.nativeLibraryDir + "/libtor.so"

            val platform = "mobile"

            launch {
                /*
                 * The point of this delay is to prevent startup race condition
                 * which occurs particularly often when running Detox tests
                 * https://github.com/TryQuiet/quiet/issues/2214
                 */
                delay(500)
                Log.i(TAG, "Starting Node project: " + lifecycleSummary())
                startNodeProjectWithArguments(
                    "bundle.cjs --torBinary $torBinary --dataPath $dataPath --dataPort $socketPort --platform $platform",
                    context.filesDir.absolutePath
                )
                delay(500)
            }
        }

        println("FINISHING BACKEND WORKER")

        markBackendClosed()
        Log.i(TAG, "Backend worker finished: " + lifecycleSummary())
        CommunicationModule.handleIncomingEvents(CommunicationModule.BACKEND_CLOSED_CHANNEL, "", "")

        // Indicate whether the work finished successfully with the Result
        return Result.success()
    }

    private external fun startNodeWithArguments(
        arguments: Array<String?>?,
        modulesPath: String?,
        dataPath: String?,
        envVars: Array<String?>?
    ): Int?

    @Throws(Exception::class)
    fun startNodeProjectWithArguments(input: String, dataPath: String) {
        val args: MutableList<String> = ArrayList(listOf(*input.split(" ").toTypedArray()))

        val scriptPath = nodeProject.projectPath + '/' + args[0]
        args.removeAt(0)

        val command: MutableList<String> = ArrayList()
        command.add("node")
        command.add("--experimental-global-webcrypto")
        command.add("--experimental-global-customevent")
        command.add(scriptPath)
        command.addAll(args)

        val standardFields = setOf(
            "DEBUG", "APPLICATION_ID", "BUILD_TYPE", "FLAVOR",
            "VERSION_CODE", "VERSION_NAME", "LIBRARY_PACKAGE_NAME",
            "IS_NEW_ARCHITECTURE_ENABLED", "IS_HERMES_ENABLED"
        )
        val envVars = BuildConfig::class.java.fields
            .filter { it.name !in standardFields }
            .mapNotNull { field ->
                field.get(null)?.let { value -> "${field.name}=$value" }
            }
            .also { vars -> vars.forEach { Log.d("BackendWorker", "Passing env var: $it") } }
            .toMutableList()

        nodeProject.waitForInit()

        startNodeWithArguments(
            command.toTypedArray(),
            "${nodeProject.projectPath}/${nodeProject.builtinModulesPath}",
            dataPath,
            envVars.toTypedArray()
        )
    }

    private fun subscribePushNotifications(port: Int, secret: String) {
        val options = IO.Options()
        val headers = mutableMapOf<String, List<String>>()
        headers["Authorization"] = listOf("Bearer $secret")
        options.extraHeaders = headers

        val webSocketClient = IO.socket("http://127.0.0.1:$port", options)
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
            if (context.isAppOnForeground())
                return@Listener // If application is in foreground, let redux be in charge
            // of displaying notifications
            notificationHandler.notify(message, username)
        }
}
