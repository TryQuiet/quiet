package com.zbaymobile

import android.app.Application
import android.content.Context
import android.util.Log
import com.zbaymobile.Utils.Const
import com.zbaymobile.Utils.Utils
import com.zbaymobile.Utils.toHex
import org.torproject.android.binary.TorResourceInstaller
import java.io.File
import java.io.FileWriter
import java.io.PrintWriter
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

class TorManager(private val context: Context) {

    // Directory containing tor files
    private var dataDirectory: File? = null

    private lateinit var torrc: File

    private lateinit var config: TorConfig

    private val log: File = File(context.filesDir, Const.TOR_LOGS_FILENAME)

    suspend fun awaitBootstrap() = suspendCoroutine<TorConfig> { continuation ->
        while (true) {
            val fileContent = log.readText(Charsets.UTF_8)
            val regex = "Bootstrapped 100%".toRegex()
            if (regex.containsMatchIn(fileContent)) {
                Log.d(Const.TAG_TOR, "Tor bootstrapped")
                continuation.resume(this.config)
                break
            }
            Thread.sleep(3000)
        }
    }

    fun startTor(controlPort: Int, socksPort: Int, httpTunnelPort: Int) {
        // Erase logs from previous run
        if (log.exists()) {
            log.delete()
        }

        /**
         * Default torrc file is being created by tor-android lib
         * so there is a need for overwrite it with custom file
         * containing all the proper configuration
         **/
        torrc = File(context.filesDir, "torrc")
        
        val torrcCustom: File? = updateTorrcCustomFile(httpTunnelPort, socksPort, controlPort, log.absolutePath)
        if ((torrcCustom?.exists()) == false || (torrcCustom?.canRead()) == false)
            return

        val binary = TorResourceInstaller(context, context.filesDir).installResources()

        if(runTorCommand(binary, torrcCustom)) {
            // Store auth cookie value
            val cookie = File(dataDirectory, "control_auth_cookie")

            val authCookie = if(cookie.exists()) {
                cookie.readBytes().toHex()
            } else {
                null
            }

            this.config = TorConfig(
                controlPort = controlPort,
                socksPort = socksPort,
                httpTunnelPort = httpTunnelPort,
                authCookie = authCookie
            )
        }
    }

    private fun runTorCommand(binary: File, torrcCustom: File?): Boolean {
        dataDirectory = context.getDir("data", Application.MODE_PRIVATE)

        val command = arrayOf(
            binary.canonicalPath,
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

}
