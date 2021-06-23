package com.zbaymobile

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.zbaymobile.Utils.Const.SERVICE_ACTION_EXECUTE


class Integrator(private val context: ReactApplicationContext): ReactContextBaseJavaModule(), WaggleService.Callbacks {

    private var waggleService: WaggleService? = null

    override fun getName(): String {
        return "Integrator"
    }

    @ReactMethod
    fun initAndroidServices() {

        val service = Intent(context, WaggleService::class.java)
            service.action = SERVICE_ACTION_EXECUTE

        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(service)
        } else {
            context.startService(service)
        }

        val serviceConnection = object: ServiceConnection {
            override fun onServiceConnected(p0: ComponentName?, binder: IBinder?) {
                waggleService = (binder as WaggleService.LocalBinder).getService()
                waggleService?.bindClient(this@Integrator)
            }

            override fun onServiceDisconnected(p0: ComponentName?) {
                waggleService?.unbindClient()
            }
        }

        context.bindService(service, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    @ReactMethod
    fun initPushNotifications() {
        val service = Intent(context, PushNotificationsService::class.java)
        val bundle = Bundle()

        service.putExtras(bundle)

        context.startService(service)
    }

    override fun onTorInit() {
        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onTorInit", true)
    }

    override fun onOnionAdded() {
        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onOnionAdded", true)
    }

    override fun onWaggleStarted() {
        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onWaggleStarted", true)
    }

}
