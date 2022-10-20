package com.zbaymobile

import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.content.res.AssetManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.ForegroundInfo
import androidx.work.WorkerParameters
import com.google.gson.Gson
import com.zbaymobile.Scheme.WebsocketConnectionPayload
import com.zbaymobile.Utils.Const
import com.zbaymobile.Utils.Const.APK_LAST_UPDATED_TIME
import com.zbaymobile.Utils.Const.NODEJS_ASSETS_TAG
import com.zbaymobile.Utils.Const.NODEJS_BUILTIN_MODULES
import com.zbaymobile.Utils.Const.NODEJS_BUILTIN_NATIVE_ASSETS_PREFIX
import com.zbaymobile.Utils.Const.NODEJS_PROJECT_DIR
import com.zbaymobile.Utils.Const.NODEJS_SHARED_PREFS
import com.zbaymobile.Utils.Const.NODEJS_TRASH_DIR
import com.zbaymobile.Utils.Utils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.torproject.android.binary.TorResourceInstaller
import java.io.*
import java.util.concurrent.Semaphore
import java.util.concurrent.ThreadLocalRandom

class BackendWorker(context: Context, workerParams: WorkerParameters):
    CoroutineWorker(context, workerParams) {

    private var running: Boolean = false

    // Store nodejs project paths
    private lateinit var trashDirPath: String
    private lateinit var filesDirPath: String
    private lateinit var projectPath: String
    private lateinit var builtinModulesPath: String
    private lateinit var nativeAssetsPath: String

    private lateinit var assetManager: AssetManager

    // Keep information about the nodejs initialization status
    private var lastUpdateTime: Long = 1
    private var previousLastUpdateTime: Long = 0
    private val initSemaphore = Semaphore(1)
    private var initCompleted = false


    companion object {
        init {
            System.loadLibrary("own-native-lib")
            System.loadLibrary("node")
        }
    }

    private fun createForegroundInfo(): ForegroundInfo {

        // This PendingIntent can be used to cancel the worker
        // val intent = WorkManager.getInstance(applicationContext)
        //     .createCancelPendingIntent(id)

        val notification = NotificationCompat.Builder(applicationContext,
            Const.INCOMING_MESSAGES_CHANNEL_ID)
            .setContentTitle("Quiet")
            .setTicker("Quiet")
            .setContentText("Backend is running")
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            // Add the cancel action to the notification which can
            // be used to cancel the worker
            // .addAction(android.R.drawable.ic_delete, "cancel", intent)
            .build()

        val id = ThreadLocalRandom.current().nextInt(0, 9000 + 1)

        return ForegroundInfo(id, notification)
    }

    override suspend fun doWork(): Result {
        /* This is a simple workaround for the problem of firing doWork() method twice
           I see people on the internet have similar problems but it seems like there's no official solution
           https://stackoverflow.com/questions/59724922/workmanager-dowork-getting-fired-twice */
        if (running) return Result.success()
        running = true

        setForeground(createForegroundInfo())

        withContext(Dispatchers.IO) {
            launch {
                // The paths where we expect the node project assets to be at runtime.
                filesDirPath = applicationContext.filesDir.absolutePath
                projectPath = "$filesDirPath/$NODEJS_PROJECT_DIR"
                builtinModulesPath = "$filesDirPath/$NODEJS_BUILTIN_MODULES"
                trashDirPath = "$filesDirPath/$NODEJS_TRASH_DIR"
                nativeAssetsPath = NODEJS_BUILTIN_NATIVE_ASSETS_PREFIX + "arm64-v8a"

                // Init nodejs project
                init()
            }

            // Call special port opened by backend to indicate if it is alive or not

            // This is the only port we really need here
            val dataPort        = Utils.getOpenPort(11000)

            // Those we should get inside tor module
            val controlPort     = Utils.getOpenPort(12000)
            val socksPort       = Utils.getOpenPort(13000)
            val httpTunnelPort  = Utils.getOpenPort(14000)

            val dataDirectoryPath = Utils.createDirectory(applicationContext)

            val tor = TorResourceInstaller(applicationContext, applicationContext.filesDir).installResources()
            val torPath = tor.canonicalPath

            val websocketConnectionPayload = WebsocketConnectionPayload(dataPort)
            NotificationModule.handleIncomingEvents(NotificationModule.WEBSOCKET_CONNECTION_CHANNEL, Gson().toJson(websocketConnectionPayload))
            
            startNodeProjectWithArguments("lib/mobileBackendManager.js -d $dataDirectoryPath -p $dataPort -c $controlPort -s $socksPort -t $httpTunnelPort -a $torPath")
        }

        // Indicate whether the work finished successfully with the Result
        return Result.success()
    }

    private fun init() {
        if (wasAPKUpdated()) {
            try {
                initSemaphore.acquire()
                emptyTrash()
                try {
                    copyNodeJsAssets()
                    initCompleted = true
                } catch (e: IOException) {
                    throw RuntimeException("Node assets copy failed", e)
                }
                initSemaphore.release()
                emptyTrash()
            } catch (ie: InterruptedException) {
                initSemaphore.release()
                ie.printStackTrace()
            }
        } else {
            initCompleted = true
        }
    }

    private fun waitForInit() {
        if (!initCompleted) {
            try {
                initSemaphore.acquire()
                initSemaphore.release()
            } catch (ie: InterruptedException) {
                initSemaphore.release()
                ie.printStackTrace()
            }
        }
    }

    private external fun startNodeWithArguments(
        arguments: Array<String?>?,
        modulesPath: String?
    ): Int?

    @Throws(Exception::class)
    fun startNodeProjectWithArguments(input: String) {
        val args: MutableList<String> = ArrayList(listOf(*input.split(" ").toTypedArray()))

        val scriptPath = projectPath + '/' + args[0]

        // Remove script file name from arguments list
        args.removeAt(0)

        val command: MutableList<String> = ArrayList()
        command.add("node")
        command.add(scriptPath)
        command.addAll(args)

        waitForInit()

        startNodeWithArguments(
            command.toTypedArray(),
            "$projectPath:$builtinModulesPath"
        )
    }

    private fun wasAPKUpdated(): Boolean {
        val prefs: SharedPreferences = applicationContext.getSharedPreferences(
            NODEJS_SHARED_PREFS,
            Context.MODE_PRIVATE
        )
        this.previousLastUpdateTime = prefs.getLong(APK_LAST_UPDATED_TIME, 0)
        try {
            val packageInfo: PackageInfo = applicationContext.packageManager
                .getPackageInfo(applicationContext.packageName, 0)
            this.lastUpdateTime = packageInfo.lastUpdateTime
        } catch (e: PackageManager.NameNotFoundException) {
            e.printStackTrace()
        }
        return this.lastUpdateTime != this.previousLastUpdateTime
    }

    private fun saveLastUpdateTime() {
        val prefs: SharedPreferences = applicationContext.getSharedPreferences(
            NODEJS_SHARED_PREFS,
            Context.MODE_PRIVATE
        )
        val editor = prefs.edit()
        editor.putLong(APK_LAST_UPDATED_TIME, this.lastUpdateTime)
        editor.apply()
    }

    private fun emptyTrash() {
        val trash = File(trashDirPath)
        if (trash.exists()) {
            deleteFolderRecursively(trash)
        }
    }

    private fun deleteFolderRecursively(file: File): Boolean {
        return try {
            var res = true
            for (childFile in file.listFiles()!!) {
                res = if (childFile.isDirectory) {
                    res and deleteFolderRecursively(childFile)
                } else {
                    res and childFile.delete()
                }
            }
            res = res and file.delete()
            res
        } catch (e: java.lang.Exception) {
            e.printStackTrace()
            false
        }
    }

    @Throws(IOException::class)
    private fun copyNativeAssetsFrom(): Boolean {
        // Load the additional asset folder and files lists
        val nativeDirs = readFileFromAssets("$nativeAssetsPath/dir.list")
        val nativeFiles = readFileFromAssets("$nativeAssetsPath/file.list")
        // Copy additional asset files to project working folder
        if (nativeFiles.size > 0) {
            Log.v(
                NODEJS_ASSETS_TAG,
                "Building folder hierarchy for $nativeAssetsPath"
            )
            for (dir in nativeDirs) {
                File("$projectPath/$dir").mkdirs()
            }
            Log.v(
                NODEJS_ASSETS_TAG,
                "Copying assets using file list for $nativeAssetsPath"
            )
            for (file in nativeFiles) {
                val src = "$nativeAssetsPath/$file"
                val dest = "$projectPath/$file"
                copyAsset(src, dest)
            }
        } else {
            Log.v(
                NODEJS_ASSETS_TAG,
                "No assets to copy from $nativeAssetsPath"
            )
        }
        return true
    }

    @Throws(IOException::class)
    private fun copyNodeJsAssets() {
        assetManager = applicationContext.assets

        // If a previous project folder is present, move it to the trash.
        val nodeDirReference = File(projectPath)
        if (nodeDirReference.exists()) {
            val trash = File(trashDirPath)
            nodeDirReference.renameTo(trash)
        }

        // Load the nodejs project's folder and file lists.
        val dirs: java.util.ArrayList<String> = readFileFromAssets("dir.list")
        val files: java.util.ArrayList<String> = readFileFromAssets("file.list")

        // Copy the nodejs project files to the application's data path.
        if (dirs.size > 0 && files.size > 0) {
            Log.d("NODE_ASSETS", "Node assets copy using pre-built lists")
            for (dir in dirs) {
                File("$filesDirPath/$dir").mkdirs()
            }
            for (file in files) {
                val dest = "$filesDirPath/$file"
                copyAsset(file, dest)
            }
        } else {
            Log.d("NODE_ASSETS", "Node assets copy enumerating APK assets")
            copyAssetFolder(
                NODEJS_PROJECT_DIR,
                projectPath
            )
        }

        copyNativeAssetsFrom()


        saveLastUpdateTime()
        Log.d("NODE_ASSETS", "Node assets copy completed successfully")
    }

    // Recursively copies contents of a folder in assets to a path
    @Throws(IOException::class)
    private fun copyAssetFolder(fromAssetPath: String, toPath: String) {
        val files = assetManager.list(fromAssetPath)
        if (files!!.isEmpty()) {
            // If it's a file, it won't have any assets "inside" it.
            copyAsset(fromAssetPath, toPath)
        } else {
            File(toPath).mkdirs()
            for (file in files) copyAssetFolder(
                "$fromAssetPath/$file",
                "$toPath/$file"
            )
        }
    }

    @Throws(IOException::class)
    private fun copyAsset(fromAssetPath: String, toPath: String) {
        var `in`: InputStream?
        var out: OutputStream?
        `in` = assetManager.open(fromAssetPath)
        File(toPath).createNewFile()
        out = FileOutputStream(toPath)
        copyFile(`in`, out)
        `in`.close()
        `in` = null
        out.flush()
        out.close()
        out = null
    }

    // Copy file from an input stream to an output stream
    @Throws(IOException::class)
    private fun copyFile(`in`: InputStream, out: OutputStream) {
        val buffer = ByteArray(1024)
        var read: Int
        while (`in`.read(buffer).also { read = it } != -1) {
            out.write(buffer, 0, read)
        }
    }

    private fun readFileFromAssets(filename: String): ArrayList<String> {
        var lines = arrayListOf<String>()
        try {
            val reader =
                BufferedReader(InputStreamReader(assetManager.open(filename)))
            var line = reader.readLine()
            while (line != null) {
                lines.add(line)
                line = reader.readLine()
            }
            reader.close()
        } catch (e: FileNotFoundException) {
            Log.d("NODE_ASSETS", "File not found: $filename")
        } catch (e: IOException) {
            lines = arrayListOf()
            e.printStackTrace()
        }
        return lines
    }
}
