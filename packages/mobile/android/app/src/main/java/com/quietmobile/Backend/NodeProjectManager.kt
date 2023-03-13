package com.quietmobile.Backend

import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.content.res.AssetManager
import android.util.Log
import com.quietmobile.Utils.Const
import java.io.*
import java.util.concurrent.Semaphore

class NodeProjectManager(private val context: Context) {

    // Store nodejs project paths
    private var filesDirPath        : String = context.filesDir.absolutePath
    private var trashDirPath        : String = "$filesDirPath/${Const.NODEJS_TRASH_DIR}"
    var projectPath                 : String = "$filesDirPath/${Const.NODEJS_PROJECT_DIR}"
    var builtinModulesPath          : String = "$filesDirPath/nodejs-builtin_modules"
    private var nativeAssetsPath    : String = Const.NODEJS_BUILTIN_NATIVE_ASSETS_PREFIX + getCurrentABIName()

    private lateinit var assetManager: AssetManager

    // Keep information about the nodejs initialization status
    private var lastUpdateTime: Long = 1
    private var previousLastUpdateTime: Long = 0
    private val initSemaphore = Semaphore(1)
    private var initCompleted = false

    private external fun getCurrentABIName(): String?

    fun init() {
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

    fun waitForInit() {
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

    private fun wasAPKUpdated(): Boolean {
        val prefs: SharedPreferences = context.getSharedPreferences(
            Const.NODEJS_SHARED_PREFS,
            Context.MODE_PRIVATE
        )
        this.previousLastUpdateTime = prefs.getLong(Const.APK_LAST_UPDATED_TIME, 0)
        try {
            val packageInfo: PackageInfo = context.packageManager
                .getPackageInfo(context.packageName, 0)
            this.lastUpdateTime = packageInfo.lastUpdateTime
        } catch (e: PackageManager.NameNotFoundException) {
            e.printStackTrace()
        }
        return this.lastUpdateTime != this.previousLastUpdateTime
    }

    private fun saveLastUpdateTime() {
        val prefs: SharedPreferences = context.getSharedPreferences(
            Const.NODEJS_SHARED_PREFS,
            Context.MODE_PRIVATE
        )
        val editor = prefs.edit()
        editor.putLong(Const.APK_LAST_UPDATED_TIME, this.lastUpdateTime)
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
                Const.NODEJS_ASSETS_TAG,
                "Building folder hierarchy for $nativeAssetsPath"
            )
            for (dir in nativeDirs) {
                File("$projectPath/$dir").mkdirs()
            }
            Log.v(
                Const.NODEJS_ASSETS_TAG,
                "Copying assets using file list for $nativeAssetsPath"
            )
            for (file in nativeFiles) {
                val src = "$nativeAssetsPath/$file"
                val dest = "$projectPath/$file"
                copyAsset(src, dest)
            }
        } else {
            Log.v(
                Const.NODEJS_ASSETS_TAG,
                "No assets to copy from $nativeAssetsPath"
            )
        }
        return true
    }

    @Throws(IOException::class)
    private fun copyNodeJsAssets() {
        assetManager = context.assets

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
                Const.NODEJS_PROJECT_DIR,
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