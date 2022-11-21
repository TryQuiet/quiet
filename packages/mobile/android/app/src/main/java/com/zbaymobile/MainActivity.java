package com.zbaymobile;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.facebook.react.ReactActivity;

import com.facebook.react.ReactInstanceEventListener;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.zbaymobile.Backend.BackendWorkManager;

public class MainActivity extends ReactActivity {

    private ReactContext reactContext;

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "ZbayMobile";
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        checkAgainstIntentUpdate(intent);
    }

    private void checkAgainstIntentUpdate(Intent intent) {
        Bundle bundle = getBundleFromIntent(intent);
        if (null != bundle) {
            try {
                respondOnNotification(bundle);
            } catch( Exception e) {
                e.printStackTrace();
            }
        }
    }

    private Bundle getBundleFromIntent(Intent intent) {
        Bundle bundle = null;

        if (intent.hasExtra("notification")) {
            bundle = intent.getBundleExtra("notification");
        }

        return bundle;
    }

    private void respondOnNotification(Bundle bundle) throws Exception {
        String channel = bundle.getString("channel");
        if (null == channel) {
            throw new Exception("respondOnNotification() failed because of missing channel");
        }

        if (null != reactContext) {
            emitSwitchChannelEvent(channel);
        } else {
            ReactNativeHost reactNativeHost = ((MainApplication) getApplicationContext()).getReactNativeHost();
            if (null == reactNativeHost) {
                throw new Exception("respondOnNotification() failed because of no ReactNativeHost");
            }

            ReactInstanceManager reactInstanceManager = reactNativeHost.getReactInstanceManager();
            if (null == reactInstanceManager) {
                throw new Exception("respondOnNotification() failed because of no ReactInstanceManager");
            }

            reactContext = reactInstanceManager.getCurrentReactContext();
            if (null != reactContext) {
                emitSwitchChannelEvent(channel);
            } else {
                reactInstanceManager.addReactInstanceEventListener(new ReactInstanceEventListener() {
                    @Override
                    public void onReactContextInitialized(ReactContext context) {
                        reactContext = context;
                        // Call method which uses class scoped variable we just (re)assigned
                        emitSwitchChannelEvent(channel);
                        reactInstanceManager.removeReactInstanceEventListener(this);
                    }
                });
            }
        }
    }

    private void emitSwitchChannelEvent(String channel) {
        reactContext.getJSModule(
                DeviceEventManagerModule.RCTDeviceEventEmitter.class
        ).emit("notification", channel);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(null);

        Intent intent = getIntent();
        checkAgainstIntentUpdate(intent);

        if (BuildConfig.SHOULD_RUN_BACKEND_WORKER == "true") {
            Context context = getApplicationContext();
            new BackendWorkManager(context).enqueueRequests();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d("QUIET", "Application destroyed.");
    }
}