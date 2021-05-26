package com.zbaymobile
import android.content.Context
import com.zbaymobile.Utils.AssetsInstaller
import com.zbaymobile.Utils.Utils.getArch
import java.io.File

class DynamicLibrariesSetup(private val context: Context) {

    fun setupLibs() {
        val dynamicLibraries = File(context.filesDir, "usr")
        val assetsInstaller = AssetsInstaller(
            context = context,
            asset = null,
            assetPath = "assets/${getArch()}/libs"
        )
        assetsInstaller.installAssets(
            assetInstallDirectory = dynamicLibraries,
            executableInnerPath = null
        )
    }
}
