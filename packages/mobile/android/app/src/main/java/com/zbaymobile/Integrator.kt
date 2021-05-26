package com.zbaymobile

import android.app.ActivityManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Bundle
import android.os.IBinder
import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.zbaymobile.Utils.Utils.getOutput
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking


class Integrator(private val context: ReactContext): ReactContextBaseJavaModule(), TorService.Callbacks, NodeJSService.Callbacks {

    private val prefs =
        (context.applicationContext as MainApplication)
            .sharedPrefs

    override fun getName(): String {
        return "Integrator"
    }

    @ReactMethod
    fun initAndroidServices() {

        val torService = Intent(context, TorService::class.java)

        if(!isMyServiceRunning(TorService::class.java)) {
            Log.i("Tor Service", "Starting new service")
            context.startService(torService)
        }

        val serviceConnection = object: ServiceConnection {
            override fun onServiceConnected(p0: ComponentName?, binder: IBinder?) {

                val service = (binder as TorService.LocalBinder).getService()
                service.registerClient(this@Integrator)
                /**
                 * onServiceConnected is being called every time client bind to running Service (even just after starting a new one)
                 * so there is a need to check if Service has been running before last Activity restart
                 * in that case running Waggle service should be bound or a new one started with data of currently existing hidden service
                 * **/
                if(service.onions.isNotEmpty()) {
                    val onion = service.onions.first()
                    val bundle = Bundle()
                    bundle.putString("ADDRESS", onion.address)
                    bundle.putInt("PORT", onion.port)
                    // Socks port persistent data was updated during last Tor init
                    bundle.putInt("SOCKS", prefs.socksPort)
                    initWaggle(bundle)
                }
            }

            override fun onServiceDisconnected(p0: ComponentName?) {}
        }
        context.bindService(torService, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    override fun onOnionAdded(data: Bundle) {
        initWaggle(data)
    }

    override fun onWaggleProcessStarted(process: Process?) {
        if(process != null) {
            getOutput(process)
        }
    }

    private fun initWaggle(data: Bundle) {
        val nodeService = Intent(context, NodeJSService::class.java)

        if(!isMyServiceRunning(NodeJSService::class.java)) {
            Log.i("NodeJS Service", "Starting new service")
            nodeService.putExtra("HIDDEN_SERVICE_DATA", data)
            context.startService(nodeService)
        }

        val serviceConnection = object: ServiceConnection {
            override fun onServiceConnected(p0: ComponentName?, binder: IBinder?) {

                val service = (binder as NodeJSService.LocalBinder).getService()
                service.registerClient(this@Integrator)
            }

            override fun onServiceDisconnected(p0: ComponentName?) {}
        }
        context.bindService(nodeService, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    private fun isMyServiceRunning(serviceClass: Class<*>): Boolean {
        val manager: ActivityManager? =
            context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager?
        for (service in manager?.getRunningServices(Int.MAX_VALUE)!!) {
            if (serviceClass.name == service.service.className) {
                return true
            }
        }
        return false
    }
}
