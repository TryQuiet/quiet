package com.zbaymobile

import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.Bundle
import android.os.IBinder
import android.util.Log
import com.zbaymobile.Utils.Const
import com.zbaymobile.Utils.Utils.exec
import com.zbaymobile.Utils.Utils.getNativeLibraryDir
import com.zbaymobile.Utils.Utils.setFilePermissions
import java.io.*
import java.util.concurrent.Executors


class NodeJSService: Service() {

    private val binder = LocalBinder()
    private val executor = Executors.newCachedThreadPool()

    private lateinit var client: Callbacks

    private var process: Process? = null

    fun registerClient(client: Callbacks) {
        this.client = client
    }

    fun getRunningProcess(): Process? = process

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)

        if(intent != null) {
            executor.execute(IncomingIntentRouter(intent))
        } else {
            Log.e(Const.TAG_NODE, "Got null onStartCommand() intent")
        }

        return START_STICKY
    }

    private fun startWaggle(hiddenServiceData: Bundle?) {
        val directory = File(getNativeLibraryDir(applicationContext)!!)
        val libraries = File(filesDir, "libs")
        val files = File(filesDir, "waggle/files")

        // Create paths
        val channels = File(files, "ZbayChannels")
        channels.mkdirs()
        setFilePermissions(channels)

        val orbitdb = File(files, "OrbitDB")
        orbitdb.mkdirs()
        setFilePermissions(orbitdb)

        process = runCommand(
            directory = directory,
            libraries = libraries,
            files = files,
            hiddenServiceData = hiddenServiceData
        )
    }

    private fun runCommand(directory: File, libraries: File, files: File, hiddenServiceData: Bundle?): Process {
        val waggle = File(filesDir, "waggle")
        return exec(
            dir = directory,
            command = arrayOf(
                "./libnode.so",
                "${waggle.canonicalPath}/lib/mobileWaggleManager.js",
                "DEBUG=libp2p*",
                "-a", "${hiddenServiceData?.getString("ADDRESS")}.onion",
                "-p", "${hiddenServiceData?.getInt("PORT")}",
                "-s", "${hiddenServiceData?.getInt("SOCKS")}",
                "-d", "$files"
            ),
            env = mapOf(
                "LD_LIBRARY_PATH" to "$libraries",
                "HOME" to "$files",
                "TMP_DIR" to "$files",
                // "DEBUG" to "libp2p:*,ipfs:*"
            )
        )
    }

    override fun onBind(p0: Intent?): IBinder {
        return binder
    }

    override fun onDestroy() {
        process?.destroy()
        super.onDestroy()
    }

    interface Callbacks

    inner class LocalBinder: Binder() {
        fun getService(): NodeJSService {
            return this@NodeJSService
        }
    }

    inner class IncomingIntentRouter(val intent: Intent?): Runnable {
        override fun run() {
            val hiddenServiceData = intent?.getBundleExtra("HIDDEN_SERVICE_DATA")
            startWaggle(hiddenServiceData)
        }
    }
}
