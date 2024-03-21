package com.quietmobile.Utils

import android.content.Context
import android.util.Log
import java.io.*
import java.math.BigInteger
import java.net.ConnectException
import java.net.InetSocketAddress
import java.net.Socket
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.security.SecureRandom
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine
import kotlin.math.pow
import kotlin.random.Random

object Utils {
    fun writeToFile(file: String, data: String, context: Context) {
        try {
            val outputStreamWriter =
                OutputStreamWriter(context.openFileOutput(file, Context.MODE_APPEND))
            outputStreamWriter.append("$data \n")
            outputStreamWriter.close()
        } catch (e: IOException) {
            Log.e("Worker", "File write failed at: $e")
        }
    }

    fun createDirectory(context: Context): String {
        val dataDirectory = File(context.filesDir, "backend/files2")
        dataDirectory.mkdirs()

        return dataDirectory.absolutePath
    }

    fun generateRandomInt(length: Int = 4): Int {
        val start = 10.0.pow((length - 1).toDouble()).toInt()
        val end = 10.0.pow(length.toDouble()).toInt() - 1
        return Random.nextInt(start, end)
    }

    fun generateRandomString(length: Int): String {
        val CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        val secureRandom = SecureRandom()
        val randomString = StringBuilder(length)

        repeat(length) {
            val randomIndex = secureRandom.nextInt(CHARACTERS.length)
            randomString.append(CHARACTERS[randomIndex])
        }

        return randomString.toString()
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

    @Throws(IOException::class)
    @JvmStatic
    fun readFileAsHex(filePath: Path?): String? {
        val fileBytes = Files.readAllBytes(filePath)
        return BigInteger(1, fileBytes).toString(16)
    }

}
