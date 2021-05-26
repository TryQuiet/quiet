package com.zbaymobile

import android.content.Context
import com.zbaymobile.Utils.AssetsInstaller
import com.zbaymobile.Utils.Utils.getArch
import java.io.File

class WaggleSetup(private val context: Context) {

    fun setupWaggle() {
        val waggle = File(context.filesDir, "waggle")
        val assetsInstaller = AssetsInstaller(
            context = context,
            asset = null,
            assetPath = "assets/${getArch()}/waggle"
        )
        assetsInstaller.installAssets(
            assetInstallDirectory = waggle,
            executableInnerPath = null
        )
    }
}
