package com.zbaymobile

import android.app.ActivityManager
import android.app.Application
import android.content.Context.ACTIVITY_SERVICE
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.zbaymobile.Utils.Const
import com.zbaymobile.Utils.Utils
import com.zbaymobile.Utils.toHex
import org.torproject.android.binary.TorResourceInstaller
import com.zbaymobile.Utils.Const.TAG_NOTICE
import java.io.File
import java.io.FileWriter
import java.io.PrintWriter
import java.nio.file.Paths
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.ScheduledFuture


class TorModule(private val context: ReactApplicationContext): ReactContextBaseJavaModule(),
    LifecycleEventListener {

    init {
        context.addLifecycleEventListener(this@TorModule)
    }

    override fun getName(): String {
        return "TorModule"
    }

    private lateinit var process: Process

    private var torrc: File? = null

    private var procesTorLogsTask: ScheduledFuture<*>? = null

    // Directory containing tor files
    private var dataDirectory: File? = null

    private fun checkTorBootstrapped(file: File, httpTunnelPort: Int, socksPort: Int, controlPort: Int, authCookie: String) {
        object: Thread() {
            override fun run() {
                val fileContent = file.readText(Charsets.UTF_8)
                val regex = "Bootstrapped 100%".toRegex()
                    if (regex.containsMatchIn(fileContent)) {
                        Log.d(Const.TAG_TOR, "Tor bootstrapped")
                        procesTorLogsTask?.cancel(true)
                        procesTorLogsTask = null
                        onTorInit(httpTunnelPort, socksPort, controlPort, authCookie)
                    }
            }
        }.start()
    }

    @ReactMethod
    private fun startTor(httpTunnelPort: Int, socksPort: Int, controlPort: Int) {
        /**
         * Default torrc file is being created by tor-android lib
         * so there is a need for overwrite it with custom file
         * containing all the proper configuration
         **/
        val torLogs = File(context.filesDir, Const.TOR_LOGS_FILENAME)
        if ((torLogs.exists()) == true) {
            torLogs.delete()
        }
        torrc = File(context.filesDir, "torrc")
        
        val torrcCustom: File? = updateTorrcCustomFile(httpTunnelPort, socksPort, controlPort, torLogs.absolutePath)
        if ((torrcCustom?.exists()) == false || (torrcCustom?.canRead()) == false)
            return

        val torBinary = TorResourceInstaller(context, context.filesDir).installResources()

        checkTorAlreadyRunning()

        if(runTorCommand(torBinary, torrcCustom)) {
            var authCookie: String = ""

            val cookie = File(dataDirectory, "control_auth_cookie")
            if(cookie.exists()) {
                authCookie = cookie.readBytes().toHex()
            }

            val executorService = Executors.newSingleThreadScheduledExecutor()
            procesTorLogsTask = executorService.scheduleAtFixedRate({checkTorBootstrapped(torLogs, httpTunnelPort, socksPort, controlPort, authCookie) }, 0, 3, TimeUnit.SECONDS)
        }
    }

    private fun runTorCommand(torBinary: File, torrcCustom: File?): Boolean {
        dataDirectory = context.getDir("data", Application.MODE_PRIVATE)

        val command = arrayOf(
            torBinary.canonicalPath,
            "DataDirectory", dataDirectory?.canonicalPath,
            "--defaults-torrc", torrcCustom?.canonicalPath
        )

        val exitCode = try {
            process = Utils.exec(
                dir = null,
                command = command,
                env = null
            )
            Utils.getOutput(process)
        } catch (e: Exception) {
            Log.e(Const.TAG_TOR_ERR, "Tor was unable to start: " + e.message, e)
            return false
        }

        if(exitCode != 0) {
            Log.e(Const.TAG_TOR_ERR, "Tor did not start. Exit: $exitCode")
            return false
        }

        return true
    }

    private fun updateTorrcCustomFile(httpTunnelPort: Int, socksPort: Int, controlPort: Int, torLogsPath: String): File? {
        val extraLines = StringBuffer()
        extraLines.append("RunAsDaemon 1").append('\n')
        extraLines.append("CookieAuthentication 1").append('\n')
        extraLines.append("ControlPort ").append(controlPort).append('\n')
        extraLines.append("SOCKSPort ").append(socksPort).append('\n')
        extraLines.append("HTTPTunnelPort ").append(httpTunnelPort).append('\n')
        extraLines.append("Log notice file ").append(torLogsPath).append("\n")

        Log.d("TORRC","torrc.custom=\n$extraLines")

        val fileTorrcCustom = File(torrc?.absolutePath.toString() + ".custom")
        val success: Boolean = updateTorConfigCustom(fileTorrcCustom, extraLines.toString())

        return if (success && fileTorrcCustom.exists()) {
            fileTorrcCustom
        } else {
            null
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

    private fun onTorInit(httpTunnelPort: Int, socksPort: Int, controlPort: Int, authCookie: String) {
        val payload: WritableMap = Arguments.createMap()
        payload.putInt("httpTunnelPort", httpTunnelPort)
        payload.putInt("socksPort", socksPort)
        payload.putInt("controlPort", controlPort)
        payload.putString("authCookie", authCookie)
        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onTorInit", payload)
    }

    private fun checkTorAlreadyRunning(): Boolean {
        val activityManager: ActivityManager =
            context.getSystemService(ACTIVITY_SERVICE) as ActivityManager
        val procInfo: List<ActivityManager.RunningAppProcessInfo> = activityManager.runningAppProcesses

        for (runningProInfo in procInfo) {
            if (runningProInfo.processName == "libtor.so") {
                Log.d(Const.TAG_TOR, "Process is already running: " + runningProInfo.pid)
                return true
            }
        }

        return false
    }

    @ReactMethod
    fun createDataDirectory() {
        val dataDirectory = File(context.filesDir, "backend/files")
        dataDirectory.mkdirs()

        val path = dataDirectory.absolutePath

        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onDataDirectoryCreated", path)
    }

    override fun onHostResume() {}

    override fun onHostPause() {}

    override fun onHostDestroy() {
        Log.d(Const.TAG_TOR, "Killing process")
        process.destroy()
    }

}
