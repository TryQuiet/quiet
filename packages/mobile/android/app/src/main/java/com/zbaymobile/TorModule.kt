package com.zbaymobile

import android.app.Application
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.zbaymobile.Utils.Const
import com.zbaymobile.Utils.Utils
import com.zbaymobile.Utils.toHex
import org.torproject.android.binary.TorResourceInstaller
import java.io.File
import java.io.FileWriter
import java.io.PrintWriter

class TorModule(private val context: ReactApplicationContext): ReactContextBaseJavaModule() {

    override fun getName(): String {
        return "TorModule"
    }

    private var torrc: File? = null

    // Directory containing tor files
    private var dataDirectory: File? = null

    @ReactMethod
    private fun startTor(httpTunnelPort: Int, socksPort: Int, controlPort: Int) {
        /**
         * Default torrc file is being created by tor-android lib
         * so there is a need for overwrite it with custom file
         * containing all the proper configuration
         **/
        torrc = File(context.filesDir, "torrc")

        val torrcCustom: File? = updateTorrcCustomFile(httpTunnelPort, socksPort, controlPort)
        if ((torrcCustom?.exists()) == false || (torrcCustom?.canRead()) == false)
            return

        val torBinary = TorResourceInstaller(context, context.filesDir).installResources()

        if(runTorCommand(torBinary, torrcCustom)) {
            var authCookie: String = ""

            val cookie = File(dataDirectory, "control_auth_cookie")
            if(cookie.exists()) {
                authCookie = cookie.readBytes().toHex()
            }

            onTorInit(httpTunnelPort, socksPort, controlPort, authCookie)
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
            val process = Utils.exec(
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

    private fun updateTorrcCustomFile(httpTunnelPort: Int, socksPort: Int, controlPort: Int): File? {
        val extraLines = StringBuffer()

        extraLines.append("RunAsDaemon 1").append('\n')
        extraLines.append("CookieAuthentication 1").append('\n')
        extraLines.append("ControlPort ").append(controlPort).append('\n')
        extraLines.append("SOCKSPort ").append(socksPort).append('\n')
        extraLines.append("HTTPTunnelPort ").append(httpTunnelPort).append('\n')

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

    @ReactMethod
    fun createDataDirectory() {
        val dataDirectory = File(context.filesDir, "backend/files")
        dataDirectory.mkdirs()

        val path = dataDirectory.absolutePath

        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onDataDirectoryCreated", path)
    }

}
