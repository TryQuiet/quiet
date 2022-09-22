package com.zbaymobile;

import android.content.Intent;
import android.os.Bundle;

import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import com.facebook.react.ReactActivity;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.concurrent.TimeUnit;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "ZbayMobile";
    }

    private void sendNotificationInfo (ReactApplicationContext reactContext, Intent intent) {
        String channelAddress = intent.getStringExtra("channelAddress");
        if (channelAddress != null) {
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("notification", channelAddress);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(null);

        PeriodicWorkRequest backendRequest =
                new PeriodicWorkRequest.Builder(BackendWorker.class, 15, TimeUnit.MINUTES)
                        .setInitialDelay(15, TimeUnit.MINUTES)
                        .build();

        WorkManager
                .getInstance(getApplicationContext())
                .enqueue(backendRequest);
    }

    @Override
    protected void onResume() {
        super.onResume();
        Intent intent = getIntent();

        String tag = intent.getStringExtra("TAG");
        if (tag == null) return;

        if (tag.equals("notification")) {
            ReactApplicationContext reactContext = (ReactApplicationContext) getReactNativeHost().getReactInstanceManager().getCurrentReactContext();
            this.sendNotificationInfo(reactContext, intent);
        }
    }
}