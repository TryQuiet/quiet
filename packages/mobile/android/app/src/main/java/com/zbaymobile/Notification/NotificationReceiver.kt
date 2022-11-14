package com.zbaymobile.Notification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat.startActivity
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.zbaymobile.MainActivity


class NotificationReceiver: BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        val channel = intent?.getStringExtra("channel")
        if (channel != null) {
            val handler = Handler(Looper.getMainLooper())
            handler.post(Runnable {
                val reactInstanceManager =
                    (context?.applicationContext as ReactApplication).reactNativeHost.reactInstanceManager

                val reactContext: ReactContext? = reactInstanceManager?.currentReactContext

                if (reactContext != null) {
                    respondOnNotification(reactContext, channel)
                } else {
                    reactInstanceManager.addReactInstanceEventListener(object: ReactInstanceEventListener {
                        override fun onReactContextInitialized(reactContext: ReactContext?) {
                            if (reactContext != null) {
                                respondOnNotification(reactContext, channel)
                            }
                            reactInstanceManager.removeReactInstanceEventListener(this)
                        }
                    })
                    if (!reactInstanceManager.hasStartedCreatingInitialContext()) {
                        reactInstanceManager.createReactContextInBackground()
                    }
                }
            })
        }
    }

    private fun wakeActivity(context: ReactContext) {
        val intent = Intent(
            context,
            MainActivity::class.java
        )

        intent.addFlags(
            Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT
                    or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                    or Intent.FLAG_ACTIVITY_NEW_TASK)

        startActivity(context, intent, null)
    }

    private fun respondOnNotification(context: ReactContext, channel: String) {
        // Pass channel address to react component
        context.getJSModule(
            DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
        ).emit("notification", channel)
        // Bring app to front
        wakeActivity(context)
    }
}
