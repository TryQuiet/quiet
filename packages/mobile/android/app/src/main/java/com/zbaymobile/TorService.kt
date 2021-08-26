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
import com.zbaymobile.Utils.Const.NOTIFICATION_CHANNEL_ID
import com.zbaymobile.Utils.Const.NOTIFICATION_FOREGROUND_SERVICE_ID
import com.zbaymobile.Utils.Const.SERVICE_ACTION_EXECUTE
import com.zbaymobile.Utils.Const.SERVICE_ACTION_STOP
import com.zbaymobile.Utils.Const.TAG_TOR
import com.zbaymobile.Utils.Const.TAG_TOR_ERR
import com.zbaymobile.Utils.Utils.exec
import com.zbaymobile.Utils.Utils.getOutput
import net.freehaven.tor.control.TorControlConnection
import org.torproject.android.binary.TorResourceInstaller
import java.io.*
import java.net.Socket
import java.util.concurrent.Executors


class TorService: Service() {

    private var wakelock: PowerManager.WakeLock? = null

    private var notificationManager: NotificationManager? = null
    private var notificationBuilder: NotificationCompat.Builder? = null

    private val binder = LocalBinder()
    private val executor = Executors.newCachedThreadPool()

    private var client: Callbacks? = null

    private var fileTorrc: File? = null

    private var torControlConnection: TorControlConnection? = null
    private var torServiceConnection: ServiceConnection? = null

    private var shouldUnbindTorService = false

    private var onions = mutableListOf<Onion>()

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
            Intent(applicationContext, TorService::class.java).setAction(SERVICE_ACTION_STOP)

        notificationBuilder!!.addAction(
            android.R.drawable.ic_delete,
            getString(R.string.close),
            PendingIntent.getService(applicationContext, 0, exitIntent, 0)
        )
        
        return notificationBuilder!!.build()
    }

    override fun onCreate() {
        super.onCreate()

        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            createNotificationChannel()

        val notification = buildNotification()
        startForeground(NOTIFICATION_FOREGROUND_SERVICE_ID, notification)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {

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

    private fun startTor(socksPort: Int, controlPort: Int) {
        /**
         * Default torrc file is being created by tor-android lib
         * so there is a need for overwrite it with custom file
         * containing all the proper configuration
         **/

        fileTorrc = File(filesDir, "torrc")

        val torrcCustom: File? = updateTorrcCustomFile(socksPort, controlPort)
        if ((torrcCustom?.exists()) == false || (torrcCustom?.canRead()) == false)
            return

        val torBinary = TorResourceInstaller(this, filesDir).installResources()

        if(runTorCommand(torBinary, torrcCustom)) {
            initControlConnection(controlPort)
        }

        torServiceConnection = object: ServiceConnection {
            override fun onServiceConnected(componentName: ComponentName?, iBinder: IBinder?) {
                try {
                    torControlConnection = initControlConnection(controlPort)
                    while(torControlConnection == null) {
                        Log.d(TAG_TOR, "Waiting for Tor control connection...")
                        Thread.sleep(500)
                        torControlConnection = initControlConnection(controlPort)
                    }

                    /** Tor has been successfully initialized **/
                    client?.onTorInit(socksPort, controlPort)

                } catch(t: Throwable) {
                    /* Stop Tor in case of any exception,
                       to avoid running unhandled instances
                       and occupying ports */
                    Log.e(TAG_TOR_ERR, t.message ?: "unknown error")
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
            TorService::class.java
        )

        shouldUnbindTorService = if (Build.VERSION.SDK_INT < 29) {
            bindService(serviceIntent, torServiceConnection!!, BIND_AUTO_CREATE)
        } else {
            bindService(serviceIntent, BIND_AUTO_CREATE, executor, torServiceConnection!!)
        }
    }

    private fun initControlConnection(controlPort: Int): TorControlConnection {
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
            Log.e(TAG_TOR_ERR, "Tor was unable to start: " + e.message, e)
            return false
        }

        if(exitCode != 0) {
            Log.e(TAG_TOR_ERR, "Tor did not start. Exit: $exitCode")
            return false
        }

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

    private fun updateTorrcCustomFile(socksPort: Int, controlPort: Int): File? {
        val extraLines = StringBuffer()

        extraLines.append("RunAsDaemon 1").append('\n')
        extraLines.append("CookieAuthentication 0").append('\n')
        extraLines.append("ControlPort ").append(controlPort).append('\n')
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
                    Log.d(TAG_TOR_ERR, "Error shutting down Tor via control port", e)
                }

                if (shouldUnbindTorService) {
                    unbindService(torServiceConnection!!)
                    shouldUnbindTorService = false
                }

                torControlConnection = null
            }
        }.start()
    }

    fun addHiddenService(port: Int, privKey: String) {

        var key: String = privKey

        val res = torControlConnection?.addOnion(
            key,
            mutableMapOf(port to "127.0.0.1:$port"),
            listOf("Detach")
        )

        val address = res?.get("onionAddress").toString()

        key = res?.get("onionPrivKey") ?: privKey

        Log.d(TAG_TOR, "Hidden service created with address $address.onion")

        val onion = Onion(
            address = address,
            key = key,
            port = port
        )

        onions.add(onion)

        client?.onOnionAdded(address = onion.address, key = onion.key, port = onion.port)
    }

    override fun onBind(p0: Intent?): IBinder {
        return binder
    }

    private fun stopService() {
        stopTor()
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
        fun onTorInit(socksPort: Int, controlPort: Int)
        fun onOnionAdded(address: String, key: String, port: Int)
    }

    inner class LocalBinder: Binder() {
        fun getService(): TorService {
            return this@TorService
        }
    }

    inner class IncomingIntentRouter(private val intent: Intent): Runnable {
        override fun run() {
            val socksPort = intent.getIntExtra("socksPort", 9050)
            val controlPort = intent.getIntExtra("controlPort", 9151)
            startTor(socksPort, controlPort)
        }
    }
}
