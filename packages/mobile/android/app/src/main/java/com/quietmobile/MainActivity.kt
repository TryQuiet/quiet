package com.quietmobile

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactHost
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.quietmobile.Backend.BackendWorkManager
import com.quietmobile.Communication.CommunicationModule
import com.quietmobile.Push.QuietStorage
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {
    private val pendingContextListeners = mutableMapOf<ReactInstanceEventListener, ReactHost>()
    companion object {
        private const val TAG = "MainActivity"
    }

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
        // Install Screens' restoration factory before Android restores fragments.
        supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
        super.onCreate(savedInstanceState)

        val intent = intent
        checkAgainstIntentUpdate(intent)

        if (shouldStartBackend()) {
            val context = applicationContext
            Log.i(TAG, "onCreate ensureStartedForForegroundAppOpen requested")
            BackendWorkManager(context).ensureStartedForForegroundAppOpen()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        checkAgainstIntentUpdate(intent)
    }

    override fun onRequestPermissionsResult(
            requestCode: Int,
            permissions: Array<out String>,
            grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        CommunicationModule.handleNotificationPermissionResult(requestCode, grantResults)
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
        val channel =
                bundle.getString("channel")
                        ?: throw java.lang.Exception(
                                "respondOnNotification() failed because of missing channel"
                        )

        getCurrentReactContext { context: ReactContext -> emitSwitchChannelEvent(context, channel) }
    }

    private fun getCurrentReactContext(callback: (ReactContext) -> Unit) {
        val host = checkNotNull(reactHost) { "React host must be available for notification routing" }
        val reactContext = host.currentReactContext
        if (null != reactContext) {
            callback(reactContext)
        } else {
            val listener = object : ReactInstanceEventListener {
                override fun onReactContextInitialized(context: ReactContext) {
                    host.removeReactInstanceEventListener(this)
                    pendingContextListeners.remove(this)
                    callback(context)
                }
            }
            pendingContextListeners[listener] = host
            host.addReactInstanceEventListener(listener)
        }
    }

    override fun onDestroy() {
        pendingContextListeners.forEach { (listener, host) -> host.removeReactInstanceEventListener(listener) }
        pendingContextListeners.clear()
        super.onDestroy()
    }

    private fun emitSwitchChannelEvent(reactContext: ReactContext, channel: String) {
        val deviceEventEmitter: RCTDeviceEventEmitter =
                reactContext.getJSModule(RCTDeviceEventEmitter::class.java)

        deviceEventEmitter.emit("notification", channel)
    }

    override fun onResume() {
        super.onResume()
        QuietStorage.setAppForeground(true)
        if (shouldStartBackend()) {
            Log.i(TAG, "onResume ensureStartedForForegroundAppOpen requested")
            BackendWorkManager(applicationContext).ensureStartedForForegroundAppOpen()
        }
        Log.i(TAG, "onResume syncBackendWorkerState requested")
        CommunicationModule.syncBackendWorkerState(applicationContext)
        // Dismiss all notifications if one of them is tapped
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancelAll()
    }

    override fun onPause() {
        super.onPause()
        QuietStorage.setAppForeground(false)
        Log.i(TAG, "onPause syncBackendWorkerState requested")
        CommunicationModule.syncBackendWorkerState(applicationContext)
    }

    private fun shouldStartBackend(): Boolean {
        return BuildConfig.SHOULD_RUN_BACKEND_WORKER == "true"
    }
}
