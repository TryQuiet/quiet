package com.zbaymobile

import android.app.*
import android.content.Intent
import android.os.*
import android.util.Log
import com.zbaymobile.Utils.Const.SERVICE_ACTION_EXECUTE
import com.zbaymobile.Utils.Const.TAG_TOR
import com.zbaymobile.Utils.Const.TAG_TOR_ERR
import com.zbaymobile.Utils.Utils.exec
import com.zbaymobile.Utils.Utils.getOutput
import com.zbaymobile.Utils.toHex
import org.torproject.android.binary.TorResourceInstaller
import java.io.*
import java.util.concurrent.Executors

class TorService: Service() {

    private val binder = LocalBinder()
    private val executor = Executors.newCachedThreadPool()

    private var client: Callbacks? = null

    private var torrc: File? = null
    private var dataDirectory: File? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        if(action != null){
            when(action) {
                SERVICE_ACTION_EXECUTE -> {
                    Log.d(TAG_TOR, "Service executed")
                    executor.execute(IncomingIntentRouter(intent))
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
        torrc = File(filesDir, "torrc")

        val torrcCustom: File? = updateTorrcCustomFile(socksPort, controlPort)
        if ((torrcCustom?.exists()) == false || (torrcCustom?.canRead()) == false)
            return

        val torBinary = TorResourceInstaller(this, filesDir).installResources()

        if(runTorCommand(torBinary, torrcCustom)) {
            var authCookie: String = ""

            val cookie = File(dataDirectory, "control_auth_cookie")
            if(cookie.exists()) {
                authCookie = cookie.readBytes().toHex()
            }

            client?.onTorInit(socksPort, controlPort, authCookie)
        }
    }

    private fun runTorCommand(torBinary: File, torrcCustom: File?): Boolean {

        dataDirectory = getDir("data", Application.MODE_PRIVATE)

        val command = arrayOf(
            torBinary.canonicalPath,
            "DataDirectory", dataDirectory?.canonicalPath,
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
        extraLines.append("CookieAuthentication 1").append('\n')
        extraLines.append("ControlPort ").append(controlPort).append('\n')
        extraLines.append("SOCKSPort ").append(socksPort).append('\n')

        Log.d("TORRC","torrc.custom=\n$extraLines")

        val fileTorrcCustom = File(torrc?.absolutePath.toString() + ".custom")
        val success: Boolean = updateTorConfigCustom(fileTorrcCustom, extraLines.toString())

        return if (success && fileTorrcCustom.exists()) {
            fileTorrcCustom
        } else {
            null
        }
    }

    override fun onBind(p0: Intent?): IBinder {
        return binder
    }

    fun bindClient(client: Callbacks) {
        this.client = client
    }

    fun unbindClient() {
        this.client = null
    }

    interface Callbacks {
        fun onTorInit(socksPort: Int, controlPort: Int, authCookie: String)
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
