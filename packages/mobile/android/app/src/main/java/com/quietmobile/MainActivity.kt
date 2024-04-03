package com.quietmobile

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.AttributeSet
import android.view.View
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter

class MainActivity : ReactActivity() {

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "QuietMobile"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
            DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)

        val intent = intent
        checkAgainstIntentUpdate(intent)

        if (BuildConfig.SHOULD_RUN_BACKEND_WORKER === "true") {
            val context = applicationContext
            BackendWorkManager(context).enqueueRequests()
        }
    }

    override fun onCreateView(name: String, context: Context, attrs: AttributeSet): View? {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            checkNotificationsPermission()
        }
        return super.onCreateView(name, context, attrs)
    }

    private val NOTIFICATION_PERMISSION_REQUEST_CODE = 200

    @RequiresApi(Build.VERSION_CODES.TIRAMISU)
    private fun checkNotificationsPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            // Requesting the permission
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), NOTIFICATION_PERMISSION_REQUEST_CODE)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        checkAgainstIntentUpdate(intent)
    }

    private fun checkAgainstIntentUpdate(intent: Intent) {
        val bundle: Bundle? = getBundleFromIntent(intent)
        if (bundle != null) {
            try {
                respondOnNotification(bundle)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun getBundleFromIntent(intent: Intent): Bundle? {
        var bundle: Bundle? = null
        if (intent.hasExtra("notification")) {
            bundle = intent.getBundleExtra("notification")
        }
        return bundle
    }

    @Throws(java.lang.Exception::class)
    private fun respondOnNotification(bundle: Bundle) {
        val channel = bundle.getString("channel")
                ?: throw java.lang.Exception("respondOnNotification() failed because of missing channel")

        getCurrentReactContext { context: ReactContext ->
            emitSwitchChannelEvent(context, channel)
        }
    }

    @SuppressLint("VisibleForTests")
    private fun getCurrentReactContext(callback: (ReactContext) -> Unit) {
        val reactContext = reactInstanceManager.currentReactContext
        if (null != reactContext) {
            callback(reactContext)
        } else {
            reactInstanceManager.addReactInstanceEventListener(object : ReactInstanceEventListener {
                override fun onReactContextInitialized(context: ReactContext) {
                    callback(context)
                    reactInstanceManager.removeReactInstanceEventListener(this)
                }
            })
        }
    }

    private fun emitSwitchChannelEvent(reactContext: ReactContext, channel: String) {
        val deviceEventEmitter: RCTDeviceEventEmitter = reactContext.getJSModule(
                RCTDeviceEventEmitter::class.java
        )

        deviceEventEmitter.emit("notification", channel)
    }

    override fun onResume() {
        super.onResume()
        // Dismiss all notifications if one of them is tapped
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancelAll()
    }
}
