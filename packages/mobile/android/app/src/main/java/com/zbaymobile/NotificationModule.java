package com.zbaymobile;

import android.app.ActivityManager;
import android.app.PendingIntent;
import android.app.TaskStackBuilder;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.RCTNativeAppEventEmitter;
import com.janeasystems.rn_nodejs_mobile.RNNodeJsMobileModule;
import com.zbaymobile.Utils.Const;
import com.zbaymobile.Utils.Utils;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import javax.annotation.Nullable;

public class NotificationModule extends ReactContextBaseJavaModule {

    private static final String BASE_NOTIFICATION_CHANNEL = "_BASE_NOTIFICATION_";
    private static final String RICH_NOTIFICATION_CHANNEL = "_RICH_NOTIFICATION_";
    public static final String WEBSOCKET_CONNECTION_CHANNEL = "_WEBSOCKET_CONNECTION_";
    public static final String INIT_CHECK_CHANNEL = "_INIT_CHECK_";

    private static ReactApplicationContext reactContext;

    @NonNull
    @Override
    public String getName() {
        return "NotificationModule";
    }

    public NotificationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        NotificationModule.reactContext = reactContext;
    }

    public static void handleIncomingEvents(String channelName, String payload) {
        switch (channelName) {
            case BASE_NOTIFICATION_CHANNEL:
            case RICH_NOTIFICATION_CHANNEL:
                notify(channelName, payload);
                break;
            case WEBSOCKET_CONNECTION_CHANNEL:
            case INIT_CHECK_CHANNEL:
                passDataToReact(channelName, payload);
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
                sendEvent("backend", params);
            }
        }).start();
    }

    // Sends an event through the App Event Emitter.
    private static void sendEvent(String eventName,
                           @Nullable WritableMap params) {
        reactContext
                .getJSModule(RCTNativeAppEventEmitter.class)
                .emit(eventName, params);
    }

    @ReactMethod
    public static void notify(String channelName, String payload) {
        if (!channelName.equals(RICH_NOTIFICATION_CHANNEL) && isAppOnForeground())
            return; // Only RICH_NOTIFICATION can be shown in foreground
        
        String event;
        JSONObject message;
        
        try {
            JSONObject data = new JSONObject(payload);
            message = new JSONObject(new JSONArray(data.getString("payload")).getString(0)); // Get first message from array
            event = data.getString("event");
        } catch (JSONException e) {
            Log.e("NOTIFICATION", "unexpected JSON exception", e);
            return;
        }
        
        String title = "Quiet";
        String text = "";
        String channelAddress = "";
        
        if (!event.equals(RICH_NOTIFICATION_CHANNEL) && isAppOnForeground()) return; // Only RICH_NOTIFICATION can be shown in foreground

        if(event.equals(RICH_NOTIFICATION_CHANNEL)) {
            try {
                channelAddress = message.getString("channelAddress");
                String messageContent = message.getString("message");
                title = String.format("#%s", channelAddress);
                text = Utils.truncate(messageContent, 32);
            } catch (JSONException e) {
                Log.e("NOTIFICATION", "incorrect RICH_NOTIFICATION payload", e);
                return;
            }
        }

        if (event.equals(BASE_NOTIFICATION_CHANNEL)) {
            try {
                channelAddress = message.getString("channelAddress");
                String messageContent = message.getString("message");
                title = String.format("#%s", channelAddress);
                text = Utils.truncate(messageContent, 32);
                /** Messages sent in public channels are not additionally encoded so we can access them as a plain text in this place.
                Nevertheless we'd want to display only limited information at this stage. **/
                // title = "Quiet";
                // text = String.format("You have a message in #%s", channelAddress);
            } catch (JSONException e) {
                Log.e("NOTIFICATION", "incorrect BASE_NOTIFICATION payload", e);
                return;
            }
        }

        Intent resultIntent = new Intent(reactContext, MainActivity.class);

        resultIntent.putExtra("channelAddress", channelAddress);
        resultIntent.putExtra("TAG", "notification");

        int notificationId = ThreadLocalRandom.current().nextInt(0, 9000 + 1);

        TaskStackBuilder stackBuilder = TaskStackBuilder.create(reactContext);
        stackBuilder.addNextIntentWithParentStack(resultIntent);
        PendingIntent resultPendingIntent =
                stackBuilder.getPendingIntent(notificationId,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext, Const.INCOMING_MESSAGES_CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(text)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(resultPendingIntent);

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(reactContext.getApplicationContext());
        notificationManager.notify(notificationId, builder.build());
    }

    private static boolean isAppOnForeground() {
        ActivityManager activityManager = (ActivityManager) reactContext.getSystemService(Context.ACTIVITY_SERVICE);
        List<ActivityManager.RunningAppProcessInfo> appProcesses = activityManager.getRunningAppProcesses();
        if (appProcesses == null) {
            return false;
        }
        final String packageName = reactContext.getPackageName();
        for (ActivityManager.RunningAppProcessInfo appProcess : appProcesses) {
            if (appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND && appProcess.processName.equals(packageName)) {
                return true;
            }
        }
        return false;
    }
}
