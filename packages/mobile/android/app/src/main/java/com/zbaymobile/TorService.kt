package com.zbaymobile

import android.app.Application
import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.Bundle
import android.os.IBinder
import android.util.Log
import com.jaredrummler.android.shell.Shell
import com.zbaymobile.Scheme.Onion
import com.zbaymobile.Utils.Const.DEFAULT_CONTROL_PORT
import com.zbaymobile.Utils.Const.DEFAULT_SOCKS_PORT
import com.zbaymobile.Utils.Const.DIRECTORY_TOR_DATA
import com.zbaymobile.Utils.Const.TAG_TOR
import com.zbaymobile.Utils.Utils.checkPort
import com.zbaymobile.torcontrol.TorControlConnection
import org.torproject.android.binary.TorResourceInstaller
import org.torproject.android.binary.TorServiceConstants
import java.io.*
import java.net.Socket
import java.util.concurrent.Executors


class TorService: Service() {

    private val binder = LocalBinder()
    private val executor = Executors.newCachedThreadPool()

    private lateinit var prefs: Prefs
    private lateinit var client: Callbacks
    private lateinit var appCacheHome: File

    private var fileTorrc: File? = null
    private var conn: TorControlConnection? = null

    private var controlPort: Int = DEFAULT_CONTROL_PORT
    private var socksPort: Int = DEFAULT_SOCKS_PORT

    var onions = mutableListOf<Onion>()

    fun registerClient(client: Callbacks) {
        this.client = client
    }

    override fun onCreate() {
        super.onCreate()
        prefs = (application as MainApplication).sharedPrefs
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)

        if(intent != null){
            executor.execute(IncomingIntentRouter(intent))
        } else {
            Log.d(TAG_TOR, "Got null onStartCommand() intent")
        }

        return START_STICKY
    }

    private fun startTor() {
        // Make sure there are no stray daemons running
        stopTorDaemon(false)

        appCacheHome = getDir(DIRECTORY_TOR_DATA, Application.MODE_PRIVATE)
        fileTorrc = File(filesDir, TorServiceConstants.TORRC_ASSET_KEY)

        val torResourceInstaller = TorResourceInstaller(
            this,
            filesDir // install folder
        )

        val fileTorBin = torResourceInstaller.installResources()

        val tor = runTorShellCmd(
            fileTorBin
        )

        if(tor) {
            initControlConnection()

            val onionPort = checkPort(5555)
            addOnion(onionPort)
        }
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

        controlPort = checkPort(prefs.controlPort)
        prefs.controlPort = controlPort
        extraLines.append("ControlPort ").append(controlPort).append('\n')

        socksPort = checkPort(prefs.socksPort)
        prefs.socksPort = socksPort
        extraLines.append("SOCKSPort ").append(socksPort).append('\n')

        extraLines.append("CookieAuthentication 0").append('\n')


        val logFile = File(filesDir, "tor")
        logFile.mkdirs()
        extraLines.append("Log notice file ${logFile.canonicalPath}/notices.log")

        Log.d("TORRC","torrc.custom=\n$extraLines")

        val fileTorrcCustom = File(fileTorrc?.absolutePath.toString() + ".custom")
        val success: Boolean = updateTorConfigCustom(fileTorrcCustom, extraLines.toString())

        return if (success && fileTorrcCustom.exists()) {
            fileTorrcCustom
        } else {
            null
        }
    }

    private fun runTorShellCmd(fileTorBin: File): Boolean {
        /**
         * Default torrc file is being created by tor-android lib
         * so there is a need for overwrite it with custom file
         * containing all the proper configuration
         * **/
        val fileTorrcCustom: File? = updateTorrcCustomFile()
        if ((fileTorrcCustom?.exists()) == false || (fileTorrcCustom?.canRead()) == false) {
            return false
        }

        val appCacheHome: File = getDir("data", Application.MODE_PRIVATE)

        val command = fileTorBin.canonicalPath.toString() +
                " DataDirectory " + appCacheHome.canonicalPath +
                " --defaults-torrc " + fileTorrcCustom?.canonicalPath

        var exitCode = try {
            shellExec("$command --verify-config")
        } catch (e: Exception) {
            Log.e("TOR_ERR", "Tor configuration did not verify: " + e.message, e)
            return false
        }

        if(exitCode == 0) {
            exitCode = try {
                shellExec(command)
            } catch (e: Exception) {
                Log.e("TOR_ERR", "Tor was unable to start: " + e.message, e)
                return false
            }

            if(exitCode != 0) {
                Log.e("TOR_ERR", "Tor did not start. Exit: $exitCode")
                return false
            }
        }

        return true
    }

    private fun stopTorDaemon(waitForConnection: Boolean) {
        var tryCount = 0

        while (tryCount++ < 3) {
            if (conn != null) {
                Log.d(TAG_TOR, "Deleting all existing hidden services")
                onions.map { onion ->
                    conn!!.delOnion(onion.address)
                    Log.i(TAG_TOR, "${onion.address} deleted")
                }
                onions.clear()
                Log.d(TAG_TOR, "Using control port to shutdown Tor")
                try {
                    conn!!.shutdownTor("HALT")
                } catch (e: IOException) {
                    Log.e("TOR_ERR", "Error shutting down Tor via connection: " + e.message, e)
                }
                conn = null
                break
            }
            if (!waitForConnection) break
            try {
                Thread.sleep(3000)
            } catch (e: java.lang.Exception) { }
        }
    }

    private fun stopTorAsync() {
        Thread {
            Log.d(TAG_TOR, "Stopping Tor")
            try {
                stopTorDaemon(true)
            } catch (e: java.lang.Exception) {
                Log.e("TOR_ERR", "An error occurred stopping Tor: " + e.message, e)
            }
        }.start()
    }

    private fun initControlConnection() {
        val socket = Socket("127.0.0.1", controlPort)
        socket.soTimeout = 60000
        conn = TorControlConnection(socket)

        conn!!.launchThread(true)

        conn!!.authenticate(byteArrayOf(0))
    }

    private fun addOnion(port: Int) {
        val res = try {
            conn!!.addOnion(prefs.onionPrivKey, mutableMapOf(port to "127.0.0.1:$port"), listOf("Detach"))
        } catch(e: IllegalArgumentException) {
            // Invalid priv key
            conn!!.addOnion("NEW:BEST", mutableMapOf(port to "127.0.0.1:$port"), listOf("Detach"))
        }

        val address = res["onionAddress"].toString()
        val key = res["onionPrivKey"].toString()

        prefs.onionPrivKey = key

        Log.d(TAG_TOR, "Hidden service created with address $address.onion")
        onions.add(
            Onion(
                address = address,
                key = key,
                port = port
            )
        )

        val bundle = Bundle()
        bundle.putString("ADDRESS", address)
        bundle.putInt("PORT", port)
        bundle.putInt("SOCKS", socksPort)
        client.onOnionAdded(bundle)
    }

    private fun shellExec(cmd: String): Int {
        val process = Shell.SH.run(cmd)

        process.stderr.map {
            Log.d("TOR_ERR", it)
        }
        process.stdout.map {
            Log.d(TAG_TOR, it)
        }

        return process.exitCode
    }

    override fun onBind(p0: Intent?): IBinder {
        return binder
    }

    override fun onDestroy() {
        stopTorAsync()
        super.onDestroy()
    }

    interface Callbacks {
        fun onOnionAdded(data: Bundle)
    }

    inner class LocalBinder: Binder() {
        fun getService(): TorService {
            return this@TorService
        }
    }

    inner class IncomingIntentRouter(val intent: Intent?): Runnable {
        override fun run() {
            startTor()
        }
    }
}
