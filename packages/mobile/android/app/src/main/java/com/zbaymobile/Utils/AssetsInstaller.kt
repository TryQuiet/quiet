package com.zbaymobile.Utils

import android.content.Context
import com.zbaymobile.Utils.Utils.setFilePermissions
import org.apache.commons.io.IOUtils
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.io.OutputStream
import java.util.concurrent.TimeoutException
import java.util.zip.ZipEntry
import java.util.zip.ZipFile

class AssetsInstaller(private val context: Context, private val asset: String?, private val assetPath: String) {

    private lateinit var resourcesDir: File

    @Throws(IOException::class, TimeoutException::class)
    fun installAssets(assetInstallDirectory: File, executableInnerPath: String?): File? {
        // Prepare install folder
        resourcesDir = assetInstallDirectory
        assetInstallDirectory.mkdirs()

        // Copy files to accessible destination
        loadAssets(assetInstallDirectory)

        // Return executable file if path was provided
        if(executableInnerPath != null) {
            val executable = File(resourcesDir, executableInnerPath)
            if (executable.exists() && executable.canExecute()) {
                return executable
            }
        }

        return null
    }

    private fun loadAssets(
        assetInstallDirectory: File
    ) {
        val apk = ZipFile(context.applicationInfo.sourceDir)

        apk.entries()
            .toList()
            .filter {
                if(asset != null) {
                    // Get specific entry if asset name was provided
                    it.name.substringAfterLast("/") == asset
                } else {
                    // Get all entries from matching directory
                    val dirs = it.name.split("/")
                    val path = assetPath.split("/")

                    var match = true
                    path.mapIndexed { i, p ->
                        try {
                            if(p != dirs[i]) match = false
                        } catch (e: IndexOutOfBoundsException) {
                            // Entry path is shorter than desired file location
                            match = false
                        }

                    }

                    match
                }
            }
            .map {
                val entry = apk.getEntry(it.name)
                    ?: throw Exception("Unable to find file in apk:${it.name}")

                val tempFile = File.createTempFile("tempFile", "zip")
                val tempOut = FileOutputStream(tempFile)

                IOUtils.copy(
                    apk.getInputStream(entry),
                    tempOut
                )

                val archive = ZipFile(tempFile)

                try {
                    archive.entries()
                        .toList()
                        .map { childEntry ->
                            val target = File(assetInstallDirectory, childEntry.name)

                            if(!target.exists()) {
                                // Keep original archive hierarchy
                                target.parentFile?.mkdirs()

                                if(!childEntry.isDirectory) {
                                    writeEntryFile(
                                        archive = archive,
                                        childEntry = childEntry,
                                        target = target
                                    )
                                }
                            }
                        }
                } finally {
                    try {
                        archive.close()
                    } catch(e: java.lang.Exception) {
                        throw e
                    }
                }
            }
    }

    private fun writeEntryFile(archive: ZipFile, childEntry: ZipEntry, target: File) {
        val stream = archive.getInputStream(childEntry)

        val out: OutputStream = FileOutputStream(target)

        val buf = ByteArray(4096)

        var len: Int

        while (stream.read(buf).also { len = it } > 0) {
            Thread.yield()
            out.write(buf, 0, len)
        }

        out.close()

        setFilePermissions(target)

        if (stream != null) {
            try {
                stream.close()
            } catch (e: Exception) {
                throw e
            }
        }
    }
}
