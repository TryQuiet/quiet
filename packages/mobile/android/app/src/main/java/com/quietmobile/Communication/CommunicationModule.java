package com.quietmobile.Communication;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
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
    private static final String TAG = "CommunicationModule";

    public static final String APP_READY_CHANNEL = "_APP_READY_";

    public static final String BACKEND_READY_CHANNEL = "_BACKEND_READY_";
    public static final String PUSH_NOTIFICATION_CHANNEL = "_PUSH_NOTIFICATION_";
    public static final String WEBSOCKET_CONNECTION_CHANNEL = "_WEBSOCKET_CONNECTION_";
    public static final String INIT_CHECK_CHANNEL = "_INIT_CHECK_";
    public static final String BACKEND_CLOSED_CHANNEL = "_BACKEND_CLOSED_";

    public static final String NOTIFICATION_PERMISSION_RESULT = "notificationPermissionResult";
    public static final String DEVICE_TOKEN_RECEIVED = "deviceTokenReceived";
    public static final int NOTIFICATION_PERMISSION_REQUEST_CODE = 200;

    private static ReactApplicationContext reactContext;
    private static int listenerCount = 0;

    // Grace period before backgrounding actually triggers hibernate. Absorbs quick
    // task-switch flicks where the user returns within a few seconds — we don't
    // want to tear down Tor/libp2p just to immediately spin them back up.
    private static final long HIBERNATE_GRACE_PERIOD_MS = 30_000L;
    private static final Handler hibernateHandler = new Handler(Looper.getMainLooper());
    @Nullable
    private static Runnable pendingHibernate;

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
                if (!QuietStorage.isAppForeground()) {
                    Log.i("CommunicationModule", "Skipping foreground push notification because app is backgrounded");
                    break;
                }
                if (QuietStorage.consumeDisplayedNotificationHash(payload)) {
                    Log.i("CommunicationModule", "Skipping foreground push notification because it was already displayed in background");
                    break;
                }
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
    public static void saveChannelMetadataInKeychain(String teamId, ReadableArray updatedChannelMetadata) {
        for (int index = 0; index < updatedChannelMetadata.size(); index++) {
            try {
                String channelMetadataAsString = updatedChannelMetadata.getString(index);
                JSONObject channelMetadata = new JSONObject(channelMetadataAsString);
                QuietStorage.addChannelMetadata(teamId, channelMetadata.getString("channelId"), channelMetadata.getString("channelName"));
            } catch (Exception e) {
                Log.e("CommunicationModule", "Error while saving channel metadata in QuietStorage", e);
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
        if (!QuietStorage.isAppForeground()) {
            Log.i(
                    TAG,
                    "Skipping NSE sync seq update from backend because app is backgrounded. Firebase service will update. teamId="
                            + teamId
                            + " syncSeq="
                            + (long) syncSeq
            );
            return;
        }

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
        if (listenerCount == 0) {
            Log.i(TAG, "Skipping deviceTokenReceived emit because no JS listeners are attached; JS will fetch the current FCM token when ready.");
            return;
        }

        WritableMap params = Arguments.createMap();
        params.putString("token", token);
        emitToJS(DEVICE_TOKEN_RECEIVED, params);
    }

    public static void emitNotificationPermissionResult(String status, @Nullable String error) {
        WritableMap params = Arguments.createMap();
        params.putString("status", status);
        if (error != null) {
            params.putString("error", error);
        }
        emitToJS(NOTIFICATION_PERMISSION_RESULT, params);
    }

    public static void handleNotificationPermissionResult(int requestCode, @NonNull int[] grantResults) {
        if (requestCode != NOTIFICATION_PERMISSION_REQUEST_CODE) {
            return;
        }

        boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        emitNotificationPermissionResult(granted ? "granted" : "denied", null);
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
            cancelPendingHibernate();
            Log.i("CommunicationModule", "syncBackendWorkerState -> stop (build flag disabled)");
            workManager.stop();
            return;
        }

        if (QuietStorage.isAppForeground()) {
            cancelPendingHibernate();
            Log.i("CommunicationModule", "syncBackendWorkerState -> enqueueRequests + wake (app foreground)");
            workManager.enqueueRequests();
            sendNodeEvent("wake", "app:wake");
            return;
        }

        if (!"true".equals(BuildConfig.QSS_ALLOWED)
                || !QuietStorage.isTeamQssEnabled()
                || QuietStorage.isUserBackgroundTorEnabled()) {
            cancelPendingHibernate();
            Log.i("CommunicationModule", "syncBackendWorkerState -> enqueueRequests (background allowed by user/team)");
            workManager.enqueueRequests();
            return;
        }

        // Default background path: delay hibernate by a grace period so brief task-switches
        // don't cause Tor/libp2p churn. Foreground service stays up either way so RAM state
        // survives; sigchain is flushed to disk in hibernate() to survive low-memory kill.
        scheduleHibernate();
    }

    private static synchronized void scheduleHibernate() {
        if (pendingHibernate != null) {
            Log.i("CommunicationModule", "syncBackendWorkerState -> hibernate already scheduled, leaving in place");
            return;
        }

        pendingHibernate = () -> {
            synchronized (CommunicationModule.class) {
                pendingHibernate = null;
            }

            if (QuietStorage.isAppForeground()) {
                Log.i("CommunicationModule", "Skipping delayed hibernate because app returned to foreground");
                return;
            }

            if (!"true".equals(BuildConfig.SHOULD_RUN_BACKEND_WORKER)) {
                Log.i("CommunicationModule", "Skipping delayed hibernate because backend worker is disabled");
                return;
            }

            if (!"true".equals(BuildConfig.QSS_ALLOWED)
                    || !QuietStorage.isTeamQssEnabled()
                    || QuietStorage.isUserBackgroundTorEnabled()) {
                Log.i("CommunicationModule", "Skipping delayed hibernate because background backend use is now allowed");
                return;
            }

            Log.i("CommunicationModule", "Executing delayed hibernate after grace period");
            sendNodeEvent("hibernate", "app:hibernate");
        };

        Log.i(
                "CommunicationModule",
                "syncBackendWorkerState -> hibernate scheduled in " + HIBERNATE_GRACE_PERIOD_MS + "ms (background, backend services idle)"
        );
        hibernateHandler.postDelayed(pendingHibernate, HIBERNATE_GRACE_PERIOD_MS);
    }

    private static synchronized void cancelPendingHibernate() {
        if (pendingHibernate == null) {
            return;
        }

        hibernateHandler.removeCallbacks(pendingHibernate);
        pendingHibernate = null;
        Log.i("CommunicationModule", "Canceled pending delayed hibernate");
    }

    /**
     * Send a message to the node backend over the _EVENTS_ channel with the
     * JSON envelope the rn-bridge EventChannel expects
     * ({"event":"<event>","payload":"<payload>"}). This is the same format iOS
     * uses via RNNodeJsMobile.sendMessageToNode.
     */
    private static void sendNodeEvent(String event, String payload) {
        String safeEvent = event.replace("\\", "\\\\").replace("\"", "\\\"");
        String safePayload = payload == null ? "" : payload.replace("\\", "\\\\").replace("\"", "\\\"");
        String envelope = "{ \"event\": \"" + safeEvent + "\", \"payload\": \"" + safePayload + "\" }";
        try {
            com.quietmobile.Backend.BackendWorker.sendMessageToNodeChannel("_EVENTS_", envelope);
        } catch (UnsatisfiedLinkError e) {
            Log.w("CommunicationModule", "Native bridge not loaded; skipping '" + event + "' event", e);
        } catch (Exception e) {
            Log.e("CommunicationModule", "Failed to send '" + event + "' event to node", e);
        }
    }

    @ReactMethod
    public void requestNotificationPermission() {
        Activity activity = getCurrentActivity();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            emitNotificationPermissionResult("granted", null);
            return;
        }

        if (activity == null) {
            Log.w(TAG, "requestNotificationPermission called without a current activity");
            emitNotificationPermissionResult("notDetermined", "Current activity unavailable");
            return;
        }

        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) {
            emitNotificationPermissionResult("granted", null);
            return;
        }

        ActivityCompat.requestPermissions(
                activity,
                new String[]{Manifest.permission.POST_NOTIFICATIONS},
                NOTIFICATION_PERMISSION_REQUEST_CODE
        );
    }

    @ReactMethod
    public void checkNotificationPermission() {
        Context context = reactContext != null ? reactContext.getApplicationContext() : null;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            emitNotificationPermissionResult("granted", null);
            return;
        }

        if (context == null) {
            Log.w(TAG, "checkNotificationPermission called without a React context");
            emitNotificationPermissionResult("notDetermined", "React context unavailable");
            return;
        }

        String status = ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED ? "granted" : "denied";
        emitNotificationPermissionResult(status, null);
    }

    @ReactMethod
    public void addListener(String eventName) {
        listenerCount += 1;
        Log.d(TAG, "addListener eventName=" + eventName + " listenerCount=" + listenerCount);
    }

    @ReactMethod
    public void removeListeners(double count) {
        listenerCount = Math.max(listenerCount - (int) count, 0);
        Log.d(TAG, "removeListeners count=" + count + " listenerCount=" + listenerCount);
    }

    @SuppressWarnings("unused")
    private static void deleteBackendData() {
        if (reactContext == null) {
            return;
        }

        Context context = reactContext.getApplicationContext();
        try {
            FileUtils.deleteDirectory(new File(context.getFilesDir(), "backend/files9"));
        } catch (IOException e) {
            Log.e("CommunicationModule", e.toString());
        }
    }
}
