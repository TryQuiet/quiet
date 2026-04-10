package com.quietmobile.Communication;

import android.annotation.SuppressLint;
import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationManagerCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;
import com.google.gson.Gson;
import com.quietmobile.Backend.BackendWorkManager;
import com.quietmobile.BuildConfig;
import com.quietmobile.MainApplication;
import com.quietmobile.Notification.NotificationHandler;
import com.quietmobile.Push.QuietStorage;
import com.quietmobile.Scheme.WebsocketConnectionPayload;

import org.apache.commons.io.FileUtils;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;

import javax.annotation.Nullable;

public class CommunicationModule extends ReactContextBaseJavaModule {

    public static final String APP_READY_CHANNEL = "_APP_READY_";

    public static final String BACKEND_READY_CHANNEL = "_BACKEND_READY_";
    public static final String PUSH_NOTIFICATION_CHANNEL = "_PUSH_NOTIFICATION_";
    public static final String WEBSOCKET_CONNECTION_CHANNEL = "_WEBSOCKET_CONNECTION_";
    public static final String INIT_CHECK_CHANNEL = "_INIT_CHECK_";
    public static final String BACKEND_CLOSED_CHANNEL = "_BACKEND_CLOSED_";

    public static final String NOTIFICATION_PERMISSION_RESULT = "notificationPermissionResult";
    public static final String DEVICE_TOKEN_RECEIVED = "deviceTokenReceived";

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
        notificationHandler = new NotificationHandler(reactContext);
    }

    @ReactMethod
    public static void handleIncomingEvents(String event, @Nullable String payload, @Nullable String extra) {
        switch (event) {
            case BACKEND_READY_CHANNEL:
            case APP_READY_CHANNEL:
                startWebsocketConnection();
                break;
            case PUSH_NOTIFICATION_CHANNEL:
                notificationHandler.notify(payload, extra);
                break;
            case INIT_CHECK_CHANNEL:
            case BACKEND_CLOSED_CHANNEL:
                passDataToReact(event, payload);
                break;
            default:
                break;
        }
    }

    @ReactMethod
    public static void saveKeysInKeychain(ReadableArray newKeys) {
        for (int index = 0; index < newKeys.size(); index++) {
            try {
                String keyAsString = newKeys.getString(index);
                JSONObject key = new JSONObject(keyAsString);
                QuietStorage.addLfaKey(key.getString("keyName"), key.getString("key"));
            } catch (Exception e) {
                Log.e("CommunicationModule", "Error while saving key in QuietStorage", e);
            }
        }
    }

    @ReactMethod
    public static void saveDeviceCredentials(String deviceId, String teamId, String signingPrivateKey) {
        try {
            QuietStorage.saveDeviceCredentials(deviceId, teamId, signingPrivateKey);
        } catch (Exception e) {
            Log.e("CommunicationModule", "saveDeviceCredentials failed", e);
        }
    }

    @ReactMethod
    public static void saveUserMetadata(ReadableArray updatedMetadata) {
        for (int index = 0; index < updatedMetadata.size(); index++) {
            try {
                String metadataAsString = updatedMetadata.getString(index);
                JSONObject metadata = new JSONObject(metadataAsString);
                QuietStorage.saveUserMetadata(
                        metadata.getString("userId"),
                        metadata.optString("nickname", metadata.getString("userId"))
                );
            } catch (Exception e) {
                Log.e("CommunicationModule", "saveUserMetadata failed", e);
            }
        }
    }

    @ReactMethod
    public static void saveNseQssUrl(String teamId, String qssUrl) {
        QuietStorage.saveQssUrl(teamId, qssUrl);
    }

    @ReactMethod
    public static void saveNseLastSyncSeq(String teamId, double syncSeq) {
        QuietStorage.saveLastSyncSeq((long) syncSeq, teamId);
    }

    @ReactMethod
    public static void setTeamQssEnabled(boolean enabled) {
        QuietStorage.setTeamQssEnabled(enabled);
        Log.i("CommunicationModule", "setTeamQssEnabled triggered syncBackendWorkerState enabled=" + enabled);
        syncBackendWorkerState();
    }

    @ReactMethod
    public static void setUserBackgroundTorEnabled(boolean enabled) {
        QuietStorage.setUserBackgroundTorEnabled(enabled);
        Log.i("CommunicationModule", "setUserBackgroundTorEnabled triggered syncBackendWorkerState enabled=" + enabled);
        syncBackendWorkerState();
    }

    @ReactMethod
    public static void clearSensitiveData() {
        try {
            QuietStorage.clearAll();
            NotificationManagerCompat.from(reactContext.getApplicationContext()).cancelAll();
            deleteBackendData();
        } catch (Exception e) {
            Log.e("CommunicationModule", "clearSensitiveData failed", e);
        }
    }

    public static void emitToJS(String eventName, @Nullable WritableMap params) {
        if (reactContext == null) {
            Log.d("RCTNativeAppEventEmitter", "Tried to send an event but got NULL on reactContext");
            return;
        }

        reactContext.getJSModule(RCTNativeAppEventEmitter.class).emit(eventName, params);
    }

    public static void emitDeviceToken(String token) {
        WritableMap params = Arguments.createMap();
        params.putString("token", token);
        emitToJS(DEVICE_TOKEN_RECEIVED, params);
    }

    public static void passDataToReact(String channelName, String payload) {
        new Thread(() -> {
            WritableMap params = Arguments.createMap();
            params.putString("channelName", channelName);
            params.putString("payload", payload);
            emitToJS("backend", params);
        }).start();
    }

    private static void startWebsocketConnection() {
        Context context = reactContext.getApplicationContext();
        int port = ((MainApplication) context).getSocketPort();
        String socketIOSecret = ((MainApplication) context).getSocketIOSecret();

        WebsocketConnectionPayload websocketConnectionPayload = new WebsocketConnectionPayload(port, socketIOSecret);
        passDataToReact(WEBSOCKET_CONNECTION_CHANNEL, new Gson().toJson(websocketConnectionPayload));
    }

    public static void syncBackendWorkerState() {
        if (reactContext == null) {
            return;
        }

        syncBackendWorkerState(reactContext.getApplicationContext());
    }

    public static void syncBackendWorkerState(Context context) {
        BackendWorkManager workManager = new BackendWorkManager(context);
        Log.i(
                "CommunicationModule",
                "syncBackendWorkerState appForeground=" + QuietStorage.isAppForeground()
                        + " qssAllowed=" + BuildConfig.QSS_ALLOWED
                        + " teamQssEnabled=" + QuietStorage.isTeamQssEnabled()
                        + " backgroundTorEnabled=" + QuietStorage.isUserBackgroundTorEnabled()
                        + " shouldRunBackendWorker=" + BuildConfig.SHOULD_RUN_BACKEND_WORKER
        );

        if (!"true".equals(BuildConfig.SHOULD_RUN_BACKEND_WORKER)) {
            Log.i("CommunicationModule", "syncBackendWorkerState -> stop (build flag disabled)");
            workManager.stop();
            return;
        }

        if (QuietStorage.isAppForeground()) {
            Log.i("CommunicationModule", "syncBackendWorkerState -> enqueueRequests (app foreground)");
            workManager.enqueueRequests();
            return;
        }

        if (!"true".equals(BuildConfig.QSS_ALLOWED)
                || !QuietStorage.isTeamQssEnabled()
                || QuietStorage.isUserBackgroundTorEnabled()) {
            Log.i("CommunicationModule", "syncBackendWorkerState -> enqueueRequests (background allowed)");
            workManager.enqueueRequests();
            return;
        }

        Log.i("CommunicationModule", "syncBackendWorkerState -> stop (background disallowed)");
        workManager.stop();
    }

    @SuppressWarnings("unused")
    private static void deleteBackendData() {
        if (reactContext == null) {
            return;
        }

        Context context = reactContext.getApplicationContext();
        try {
            FileUtils.deleteDirectory(new File(context.getFilesDir(), "backend/files7"));
        } catch (IOException e) {
            Log.e("CommunicationModule", e.toString());
        }
    }
}
