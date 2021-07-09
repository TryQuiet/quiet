package com.zbaymobile

import android.app.*
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.*
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import com.zbaymobile.Scheme.Onion
import com.zbaymobile.Utils.Const.DEFAULT_CONTROL_PORT
import com.zbaymobile.Utils.Const.DEFAULT_SOCKS_PORT
import com.zbaymobile.Utils.Const.NOTIFICATION_CHANNEL_ID
import com.zbaymobile.Utils.Const.NOTIFICATION_FOREGROUND_SERVICE_ID
import com.zbaymobile.Utils.Const.SERVICE_ACTION_EXECUTE
import com.zbaymobile.Utils.Const.SERVICE_ACTION_STOP
import com.zbaymobile.Utils.Const.TAG_NODE
import com.zbaymobile.Utils.Const.TAG_TOR
import com.zbaymobile.Utils.Utils
import com.zbaymobile.Utils.Utils.checkPort
import com.zbaymobile.Utils.Utils.exec
import com.zbaymobile.Utils.Utils.getOutput
import net.freehaven.tor.control.TorControlConnection
import org.torproject.android.binary.TorResourceInstaller
import java.io.*
import java.lang.NullPointerException
import java.lang.Process
import java.net.Socket
import java.util.concurrent.Executors


class WaggleService: Service() {

    private var wakelock: PowerManager.WakeLock? = null

    private var notificationManager: NotificationManager? = null
    private var notificationBuilder: NotificationCompat.Builder? = null

    private val binder = LocalBinder()
    private val executor = Executors.newCachedThreadPool()

    private lateinit var prefs: Prefs

    private var client: Callbacks? = null

    private var fileTorrc: File? = null

    private var torControlConnection: TorControlConnection? = null
    private var torServiceConnection: ServiceConnection? = null
    private var shouldUnbindTorService = false

    private var controlPort: Int = DEFAULT_CONTROL_PORT
    private var socksPort: Int = DEFAULT_SOCKS_PORT

    private var onions = mutableListOf<Onion>()

    private var nodeProcess: Process? = null

    @RequiresApi(api = Build.VERSION_CODES.O)
    private fun createNotificationChannel() {
        val notificationManager: NotificationManager =
            getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val name: CharSequence =
            getString(R.string.app_name)

        val channel =
            NotificationChannel(NOTIFICATION_CHANNEL_ID, name, NotificationManager.IMPORTANCE_LOW)

        notificationManager.createNotificationChannel(channel)
    }

    private fun buildNotification(): Notification {
        val intent = Intent(applicationContext, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(applicationContext, 0, intent, 0)

        if(notificationBuilder == null) {
            notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager?
            notificationBuilder = NotificationCompat.Builder(applicationContext, NOTIFICATION_CHANNEL_ID)
                .setContentTitle(getString(R.string.app_name))
                .setSmallIcon(R.drawable.ic_notification)
                .setContentIntent(pendingIntent)
                .setCategory(Notification.CATEGORY_SERVICE)
                .setPriority(Notification.PRIORITY_HIGH)
                .setOngoing(true)
        }

        // Set Exit button action
        val exitIntent =
            Intent(applicationContext, WaggleService::class.java).setAction(SERVICE_ACTION_STOP)

        notificationBuilder!!.addAction(
            android.R.drawable.ic_delete,
            getString(R.string.close),
            PendingIntent.getService(applicationContext, 0, exitIntent, 0)
        )
        
        return notificationBuilder!!.build()
    }

    override fun onCreate() {
        super.onCreate()

        prefs = (application as MainApplication).sharedPrefs

        Log.d("WAGGLE", "onServiceCreated")

        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            createNotificationChannel()

        val notification = buildNotification()
        startForeground(NOTIFICATION_FOREGROUND_SERVICE_ID, notification)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {

        Log.d("WAGGLE", "onStartCommand")

        wakelock =
            (getSystemService(Context.POWER_SERVICE) as PowerManager).run {
                newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "WaggleService::lock").apply {
                    acquire()
                }
            }

        val action = intent?.action
        if(action != null){
            when(action) {
                SERVICE_ACTION_EXECUTE -> {
                    Log.d(TAG_TOR, "Service executed")
                    executor.execute(IncomingIntentRouter(intent))
                }
                SERVICE_ACTION_STOP -> {
                    Log.d(TAG_TOR, "Service stopped")
                    stopService()
                }
            }

        } else {
            Log.d(TAG_TOR, "Got null onStartCommand() action")
        }

        return START_REDELIVER_INTENT
    }

    private fun startTor() {
        /**
         * Default torrc file is being created by tor-android lib
         * so there is a need for overwrite it with custom file
         * containing all the proper configuration
         **/

        fileTorrc = File(filesDir, "torrc")

        val torrcCustom: File? = updateTorrcCustomFile()
        if ((torrcCustom?.exists()) == false || (torrcCustom?.canRead()) == false)
            return

        val torBinary = TorResourceInstaller(this, filesDir).installResources()

        if(runTorCommand(torBinary, torrcCustom)) {
            initControlConnection()
        }

        torServiceConnection = object: ServiceConnection {
            override fun onServiceConnected(componentName: ComponentName?, iBinder: IBinder?) {
                try {
                    torControlConnection = initControlConnection()
                    while(torControlConnection == null) {
                        Log.d(TAG_TOR, "Waiting for Tor control connection...")
                        Thread.sleep(500)
                        torControlConnection = initControlConnection()
                    }

                    /** Tor has been successfully initialized **/
                    client?.onTorInit()

                    val onionPort = checkPort(5555)
                    val onion = addOnion(onionPort)

                    onions.add(onion)
                    client?.onOnionAdded(onion.address)
                    startWaggle(onion)

                } catch(t: Throwable) {
                    /* Stop Tor in case of any exception,
                       to avoid running unhandled instances
                       and occupying ports */
                    Log.e("TOR_ERR", t.message ?: "unknown error")
                    stopTor()
                    torServiceConnection = null
                }
            }

            override fun onServiceDisconnected(p0: ComponentName?) {
                torServiceConnection = null
            }

            override fun onNullBinding(name: ComponentName?) {
                stopTor()
                torServiceConnection = null
            }

            override fun onBindingDied(name: ComponentName?) {
                stopTor()
                torServiceConnection = null
            }
        }

        val serviceIntent = Intent(
            this,
            WaggleService::class.java
        )

        shouldUnbindTorService = if (Build.VERSION.SDK_INT < 29) {
            bindService(serviceIntent, torServiceConnection!!, BIND_AUTO_CREATE)
        } else {
            bindService(serviceIntent, BIND_AUTO_CREATE, executor, torServiceConnection!!)
        }
    }

    private fun initControlConnection(): TorControlConnection {
        val socket = Socket("127.0.0.1", controlPort)
        // Client will be trying to connect for no more than 1 minute
        socket.soTimeout = 60000

        val connection = TorControlConnection(socket)
        connection.launchThread(true)
        connection.authenticate(byteArrayOf(0))
        return connection
    }

    private fun runTorCommand(torBinary: File, torrcCustom: File?): Boolean {

        val appCacheHome: File = getDir("data", Application.MODE_PRIVATE)

        val command = arrayOf(
            torBinary.canonicalPath,
            "DataDirectory", appCacheHome.canonicalPath,
            "--defaults-torrc", torrcCustom?.canonicalPath
        )

        val exitCode = try {
            val process = exec(
                dir = null,
                command = command,
                env = null
            )
            getOutput(process)
        } catch (e: Exception) {
            Log.e("TOR_ERR", "Tor was unable to start: " + e.message, e)
            return false
        }

        if(exitCode != 0) {
            Log.e("TOR_ERR", "Tor did not start. Exit: $exitCode")
            return false
        }

        client?.onTorInit()

        return true
    }

    private fun updateTorConfigCustom(fileTorrcCustom: File?, extraLines: String?): Boolean {
        val fos = FileWriter(fileTorrcCustom, false)
        val ps = PrintWriter(fos)
        ps.print(extraLines)
        ps.flush()
        ps.close()
        return true
    }

    private fun updateTorrcCustomFile(): File? {
        val extraLines = StringBuffer()

        extraLines.append("RunAsDaemon 1").append('\n')

        extraLines.append("CookieAuthentication 0").append('\n')

        controlPort = checkPort(prefs.controlPort)
        prefs.controlPort = controlPort
        extraLines.append("ControlPort ").append(controlPort).append('\n')

        socksPort = checkPort(prefs.socksPort)
        prefs.socksPort = socksPort
        extraLines.append("SOCKSPort ").append(socksPort).append('\n')

        Log.d("TORRC","torrc.custom=\n$extraLines")

        val fileTorrcCustom = File(fileTorrc?.absolutePath.toString() + ".custom")
        val success: Boolean = updateTorConfigCustom(fileTorrcCustom, extraLines.toString())

        return if (success && fileTorrcCustom.exists()) {
            fileTorrcCustom
        } else {
            null
        }
    }

    @Synchronized
    @Throws(java.lang.Exception::class)
    private fun stopTor() {
        Thread {
            if (torControlConnection != null) {
                Log.d(TAG_TOR, "Deleting all existing hidden services")
                onions.map { onion ->
                    torControlConnection?.delOnion(onion.address)
                    Log.i(TAG_TOR, "${onion.address} deleted")
                }
                onions.clear()

                try {
                    Log.d(TAG_TOR, "Using control port to shutdown Tor")
                    torControlConnection?.shutdownTor("HALT")
                } catch (e: IOException) {
                    Log.d(TAG_TOR, "Error shutting down Tor via control port", e)
                }

                if (shouldUnbindTorService) {
                    unbindService(torServiceConnection!!)
                    shouldUnbindTorService = false
                }

                torControlConnection = null
            }
        }.start()
    }

    private fun addOnion(port: Int): Onion {
        val key = prefs.onionPrivKey ?: "NEW:BEST"

        val res = torControlConnection!!.addOnion(
            key,
            mutableMapOf(port to "127.0.0.1:$port"),
            listOf("Detach")
        )

        val address = res["onionAddress"].toString()

        if(res["onionPrivKey"] != null) {
            prefs.onionPrivKey = res["onionPrivKey"]
        }

        Log.d(TAG_TOR, "Hidden service created with address $address.onion")

        return Onion(
            address = address,
            key = key,
            port = port
        )
    }

    private fun startWaggle(hiddenService: Onion) {
        val directory = File(Utils.getNativeLibraryDir(applicationContext)!!)
        val libraries = File(filesDir, "libs")
        val files = File(filesDir, "waggle/files")

        // Create paths
        val channels = File(files, "ZbayChannels")
        channels.mkdirs()
        Utils.setFilePermissions(channels)

        val orbitdb = File(files, "OrbitDB")
        orbitdb.mkdirs()
        Utils.setFilePermissions(orbitdb)

        nodeProcess = runWaggleCommand(
            directory = directory,
            libraries = libraries,
            files = files,
            hiddenService = hiddenService
        )

        for(i in 1..3) { // Wait for client to bind process
            if(client != null) {
                break
            }
            Log.d(TAG_NODE, "Waiting for client to bind process...")
            Thread.sleep(500)
        }

        client?.onWaggleStarted()

        try {
            getOutput(nodeProcess!!)
        } catch(e: InterruptedIOException) {}
    }

    private fun runWaggleCommand(directory: File, libraries: File, files: File, hiddenService: Onion): Process {
        val waggle = File(filesDir, "waggle")
        return exec(
            dir = directory,
            command = arrayOf(
                "./libnode.so",
                "${waggle.canonicalPath}/lib/mobileWaggleManager.js",
                "-a", "${hiddenService.address}.onion",
                "-p", "${hiddenService.port}",
                "-s", "$socksPort",
                "-d", "$files"
            ),
            env = mapOf(
                "LD_LIBRARY_PATH" to "$libraries",
                "HOME" to "$files",
                "TMP_DIR" to "$files",
                "DEBUG" to "waggle*,-waggle:libp2p:err"
            )
        )
    }

    override fun onBind(p0: Intent?): IBinder {
        return binder
    }

    private fun stopService() {
        stopTor()
        nodeProcess?.destroy()
        wakelock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        stopForeground(true)
    }

    override fun onDestroy() {
        Log.d("WAGGLE", "onServiceDestroy")
        // stopService()
        super.onDestroy()
    }

    fun bindClient(client: Callbacks) {
        this.client = client
    }

    fun unbindClient() {
        this.client = null
    }

    interface Callbacks {
        fun onTorInit()
        fun onOnionAdded(address: String)
        fun onWaggleStarted()
    }

    inner class LocalBinder: Binder() {
        fun getService(): WaggleService {
            return this@WaggleService
        }
    }

    inner class IncomingIntentRouter(val intent: Intent?): Runnable {
        override fun run() {
            startTor()
        }
    }
}
