package com.zbaymobile;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;
import android.content.Intent;
import android.content.Context;
import android.util.AttributeSet;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.facebook.react.bridge.ReactApplicationContext;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class MainActivity extends ReactActivity  {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */

   private void sendEvent() {
    Intent intent = getIntent();

    ReactInstanceManager mReactInstanceManager = getReactNativeHost().getReactInstanceManager();
    ReactApplicationContext reactContext = (ReactApplicationContext) mReactInstanceManager.getCurrentReactContext();


    Bundle bundle = intent.getExtras();
    if (bundle != null) {
        for (String key : bundle.keySet()) {
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("notification", bundle.get(key));
        }
    }
   }



  @Override
  protected String getMainComponentName() {
    return "ZbayMobile";
  }

    @Override
    protected void onResume() {
        super.onResume();
        Intent intent = getIntent();

        ReactInstanceManager mReactInstanceManager = getReactNativeHost().getReactInstanceManager();
        ReactApplicationContext reactContext = (ReactApplicationContext) mReactInstanceManager.getCurrentReactContext();

        Bundle bundle = intent.getExtras();
        if (bundle != null) {
            for (String key : bundle.keySet()) {
                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("notification", bundle.get(key));
            }
        }
    }
}