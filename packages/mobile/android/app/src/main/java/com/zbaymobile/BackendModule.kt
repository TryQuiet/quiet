package com.zbaymobile

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File

class BackendModule(private val context: ReactApplicationContext): ReactContextBaseJavaModule() {

    override fun getName(): String {
        return "BackendModule"
    }

    @ReactMethod
    fun createDataDirectory() {
        val dataDirectory = File(context.filesDir, "backend/files")
        dataDirectory.mkdirs()

        val path = dataDirectory.absolutePath

        context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onDataDirectoryCreated", path)
    }

    @ReactMethod
    fun saveDataPort(dataPort: Int) {
        val sharedPref = context.getSharedPreferences(
                context.getString(R.string.config_preferences), Context.MODE_PRIVATE)

        with (sharedPref.edit()) {
            putInt(context.getString(R.string.data_port), dataPort)
            apply()
        }
    }

    @ReactMethod
    fun saveDataDirectoryPath(path: String) {
        val sharedPref = context.getSharedPreferences(
            context.getString(R.string.config_preferences), Context.MODE_PRIVATE)

        with (sharedPref.edit()) {
            putString(context.getString(R.string.data_directory_path), path)
            apply()
        }
    }

}