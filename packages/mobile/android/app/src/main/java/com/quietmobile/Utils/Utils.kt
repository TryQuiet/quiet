package com.quietmobile.Utils

import android.content.Context
import java.io.*
import java.net.ConnectException
import java.net.InetSocketAddress
import java.net.Socket
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

object Utils {
    fun createDirectory(context: Context): String {
        val dataDirectory = File(context.filesDir, "backend/files9")
        dataDirectory.mkdirs()

        return dataDirectory.absolutePath
    }

    suspend fun getOpenPort(starting: Int) = suspendCoroutine { continuation ->
        val port = checkPort(starting)
        continuation.resume(port)
    }

    private fun checkPort(port: Int): Int {
        var isPortUsed = true
        var portToCheck = port
        while (isPortUsed) {
            isPortUsed = isPortOpen(portToCheck)
            if (isPortUsed) {
                portToCheck++
            }
        }
        return portToCheck
    }

    private fun isPortOpen(port: Int, timeout: Int = 500): Boolean {
        return try {
            val socket = Socket()
            socket.connect(InetSocketAddress("127.0.0.1", port), timeout)
            socket.close()
            true
        } catch (_: ConnectException) {
            false
        } catch (_: java.lang.Exception) {
            false
        }
    }
}
