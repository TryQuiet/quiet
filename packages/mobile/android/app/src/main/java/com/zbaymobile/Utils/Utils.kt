package com.zbaymobile.Utils

import android.content.Context
import android.os.Build
import android.util.Log
import com.zbaymobile.Utils.Const.TAG_NOTICE
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.net.ConnectException
import java.net.InetSocketAddress
import java.net.Socket


object Utils {

    fun getNativeLibraryDir(context: Context): String? {
        val appInfo = context.applicationInfo
        return appInfo.nativeLibraryDir
    }

    fun getArch(): String {
        var folder = Build.CPU_ABI
        val javaArch = System.getProperty("os.arch")
        if (javaArch != null && javaArch.contains("686")) {
            throw java.lang.Exception("Architecture not supported.")
        }
        // return folder
        return "arm64-v8a"
    }

    fun exec(dir: File, command: Array<String>, env: Map<String, String>?): Process {
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

    fun setFilePermissions(file: File) {
        file.setReadable(true)
        file.setExecutable(true)
        file.setWritable(true, false)
    }

    fun checkPort(port: Int): Int {
        var isPortUsed = true
        var _port = port
        while (isPortUsed) {
            isPortUsed = isPortOpen("127.0.0.1", _port, 500)
            if (isPortUsed) {
                _port++ //the specified port is not available, so let Tor find one instead
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
}
