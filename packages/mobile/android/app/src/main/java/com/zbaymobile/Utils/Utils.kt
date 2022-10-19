package com.zbaymobile.Utils

import android.content.Context
import android.util.Log
import com.zbaymobile.Utils.Const.TAG_NOTICE
import java.io.*
import java.net.ConnectException
import java.net.InetSocketAddress
import java.net.Socket
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

object Utils {

    fun exec(dir: File?, command: Array<String?>, env: Map<String, String>?): Process {
        val pb = ProcessBuilder(*command)
        val _env: MutableMap<String, String> = pb.environment()
        env?.map {
            _env[it.key] = it.value
        }
        return pb
            .directory(dir)
            .start()
    }

    fun getOutput(process: Process): Int {
        val stdOut = BufferedReader(InputStreamReader(process.inputStream))
        val stdError = BufferedReader(InputStreamReader(process.errorStream))

        object: Thread() {
            override fun run() {
                var output = ""
                while(stdOut.readLine()?.also { output = it } != null) {
                    Log.d(TAG_NOTICE, output)
                }
            }
        }.start()

        object: Thread() {
            override fun run() {
                var error = ""
                while(stdError.readLine()?.also { error = it } != null) {
                    Log.d(TAG_NOTICE, error)
                }
            }
        }.start()

        process.waitFor()

        if (process.exitValue() != 0) {
            throw Exception("Error: " + process.exitValue().toString())
        }

        return process.exitValue()
    }

    fun writeToFile(file: String, data: String, context: Context) {
        try {
            val outputStreamWriter =
                OutputStreamWriter(context.openFileOutput(file, Context.MODE_APPEND))
            outputStreamWriter.append("$data \n")
            outputStreamWriter.close()
        } catch (e: IOException) {
            Log.e("Worker", "File write failed: $e")
        }
    }

    fun createDirectory(context: Context): String {
        val dataDirectory = File(context.filesDir, "backend/files")
        dataDirectory.mkdirs()

        return dataDirectory.absolutePath
    }

    suspend fun getOpenPort(starting: Int) = suspendCoroutine<Int> { continuation ->
        val port = checkPort(starting)
        continuation.resume(port)
    }

    private fun checkPort(port: Int): Int {
        var isPortUsed = true
        var _port = port
        while (isPortUsed) {
            isPortUsed = isPortOpen("127.0.0.1", _port, 500)
            if (isPortUsed) {
                _port++
            }
        }
        return _port
    }

    private fun isPortOpen(ip: String?, port: Int, timeout: Int): Boolean {
        return try {
            val socket = Socket()
            socket.connect(InetSocketAddress(ip, port), timeout)
            socket.close()
            true
        } catch (ce: ConnectException) {
            false
        } catch (ex: java.lang.Exception) {
            false
        }
    }

    @JvmStatic
    fun truncate(message: String, length: Int): String? {
        return if (message.length > length) {
            String.format("%s...", message.substring(0, length))
        } else {
            message
        }
    }


}
