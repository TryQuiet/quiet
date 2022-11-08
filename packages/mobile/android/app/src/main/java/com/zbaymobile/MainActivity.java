package com.zbaymobile;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.facebook.react.ReactActivity;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactApplicationContext;

import com.zbaymobile.Backend.BackendWorkManager;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "ZbayMobile";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(null);
        Context context = getApplicationContext();
        new BackendWorkManager(context).enqueueRequests();
    }

    @Override
    protected void onResume() {
        super.onResume();

        Intent intent = getIntent();

        String channel = intent.getStringExtra("channel");

        if (channel != null) {
            ReactApplicationContext reactContext = (ReactApplicationContext) getReactNativeHost().getReactInstanceManager().getCurrentReactContext();
            assert reactContext != null;

            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("notification", channel);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d("QUIET", "Application destroyed.");
    }
}