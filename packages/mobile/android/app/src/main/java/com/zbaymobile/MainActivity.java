package com.zbaymobile;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;

import com.facebook.react.ReactActivity;

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
    protected void onDestroy() {
        super.onDestroy();
        Log.d("QUIET", "Application destroyed.");
    }
}