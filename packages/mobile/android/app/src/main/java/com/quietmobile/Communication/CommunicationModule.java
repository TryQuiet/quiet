package com.quietmobile.Communication;

import android.annotation.SuppressLint;
import android.content.Context;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;
import com.quietmobile.Notification.NotificationHandler;

import androidx.annotation.NonNull;

import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.IOException;

import javax.annotation.Nullable;


public class CommunicationModule extends ReactContextBaseJavaModule {

    public static final String PUSH_NOTIFICATION_CHANNEL = "_PUSH_NOTIFICATION_";
    public static final String WEBSOCKET_CONNECTION_CHANNEL = "_WEBSOCKET_CONNECTION_";
    public static final String INIT_CHECK_CHANNEL = "_INIT_CHECK_";
    public static final String BACKEND_CLOSED_CHANNEL = "_BACKEND_CLOSED_";

    private static ReactApplicationContext reactContext;

    @SuppressLint("StaticFieldLeak")
    private static NotificationHandler notificationHandler;

    @NonNull
    @Override
    public String getName() {
        return "CommunicationModule";
    }

    public CommunicationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        CommunicationModule.reactContext = reactContext;
        // Use dedicated class for composing and displaying notifications
        notificationHandler = new NotificationHandler(reactContext);
    }

    @ReactMethod
    public static void handleIncomingEvents(String event, String payload, String extra) {
        switch (event) {
            case PUSH_NOTIFICATION_CHANNEL:
                String message = payload;
                String username = extra;
                notificationHandler.notify(message, username);
                break;
            case WEBSOCKET_CONNECTION_CHANNEL:
            case INIT_CHECK_CHANNEL:
            case BACKEND_CLOSED_CHANNEL:
                passDataToReact(event, payload);
                break;
            default:
                break;
        }
    }

    public static void passDataToReact(String channelName, String payload) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                WritableMap params = Arguments.createMap();
                params.putString("channelName", channelName);
                params.putString("payload", payload);
                sendEvent(params);
            }
        }).start();
    }

    // Sends an event through the App Event Emitter.
    private static void sendEvent(@Nullable WritableMap params) {
        if (reactContext == null) {
            Log.d("RCTNativeAppEventEmitter", "Tried to send an event but got NULL on reactContext");
        } else {
            reactContext
                    .getJSModule(RCTNativeAppEventEmitter.class)
                    .emit("backend", params);
        }
    }

    @ReactMethod
    private static void startBackend() {
        Context context = reactContext.getApplicationContext();
        new BackendWorkManager(context).enqueueRequests();
    }

    @ReactMethod
    private static void deleteBackendData() {
        Context context = reactContext.getApplicationContext();
        try {
            FileUtils.deleteDirectory(new File(context.getFilesDir(), "backend/files"));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
