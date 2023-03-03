package com.quietmobile.Utils

import android.app.ActivityManager
import android.content.Context

fun ByteArray.toHex(): String = joinToString(separator = "") { eachByte -> "%02x".format(eachByte) }

fun Context.isAppOnForeground(): Boolean {
    val activityManager =
        this.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager

    val appProcesses = activityManager.runningAppProcesses ?: return false
    val packageName = this.packageName

    for (appProcess in appProcesses) {
        if (appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND && appProcess.processName == packageName) {
            return true
        }
    }

    return false
}
