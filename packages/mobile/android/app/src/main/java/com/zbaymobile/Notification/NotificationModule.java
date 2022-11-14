package com.zbaymobile.Notification;

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
import com.zbaymobile.MainActivity;
import com.zbaymobile.R;
import com.zbaymobile.Utils.Const;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import javax.annotation.Nullable;


public class NotificationModule extends ReactContextBaseJavaModule {

    public static final String BASE_NOTIFICATION_CHANNEL = "_BASE_NOTIFICATION_";
    public static final String RICH_NOTIFICATION_CHANNEL = "_RICH_NOTIFICATION_";
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

    public static void handleIncomingEvents(String event, String payload, String ... extra) {
        switch (event) {
            case BASE_NOTIFICATION_CHANNEL:
            case RICH_NOTIFICATION_CHANNEL:
                String username = extra.length > 0 ? extra[0] : "";
                notify(event, payload, username);
                break;
            case WEBSOCKET_CONNECTION_CHANNEL:
            case INIT_CHECK_CHANNEL:
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
                sendEvent("backend", params);
            }
        }).start();
    }

    // Sends an event through the App Event Emitter.
    private static void sendEvent(String eventName,
                           @Nullable WritableMap params) {
        if (reactContext == null) {
            Log.d("RCTNativeAppEventEmitter", "Tried to send an event but got NULL on reactContext");
        } else {
            reactContext
                    .getJSModule(RCTNativeAppEventEmitter.class)
                    .emit(eventName, params);
        }
    }

    /**
     * @param channelName - One of predefined values for incoming event channel name
     * @param message - Object of type ChannelMessage
     */
    @ReactMethod
    public static void notify(String channelName, String message, String username) {
        if (!channelName.equals(RICH_NOTIFICATION_CHANNEL) && isAppOnForeground())
            return; // Only RICH_NOTIFICATION can be shown in foreground

        String channel = "";
        String content = "";

        JSONObject _message;

        try {
            _message = new JSONObject(message);
        } catch (JSONException e) {
            Log.e("NOTIFICATION", "unexpected JSON exception", e);
            return;
        }

        // Parse user name
        String user = String.format("@%s", username);

        try {
            // Parse channel name
            String _channel = _message.getString("channelAddress");
            channel = String.format("#%s", _channel);
            // Parse message content
            String _content = _message.getString("message");
            content = String.format("%s", _content);
        } catch (JSONException e) {
            Log.e("NOTIFICATION", "incorrect NOTIFICATION payload", e);
            return;
        }

        composeNotification(channel, user, content);
    }

    private static void composeNotification(String channel, String user, String content) {
        Intent intent = new Intent(reactContext, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);

        // Remove prefix from channel name before saving extras
        String extra = channel.substring(1);
        intent.putExtra("channel", extra);

        TaskStackBuilder stackBuilder = TaskStackBuilder.create(reactContext);
        stackBuilder.addNextIntentWithParentStack(intent);

        int id_message = ThreadLocalRandom.current().nextInt(0, 9000 + 1);

        PendingIntent pendingIntent =
                stackBuilder.getPendingIntent(id_message,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Group messages per channel
        NotificationCompat.Builder groupBuilder = new NotificationCompat.Builder(reactContext, Const.INCOMING_MESSAGES_CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(channel)
                .setContentText("")
                .setStyle(new NotificationCompat.InboxStyle()
                        .setSummaryText(channel))
                .setAutoCancel(true)
                .setGroupSummary(true)
                .setGroup(channel);

        // Display individual notification for each message
        NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext, Const.INCOMING_MESSAGES_CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(user)
                .setContentText(content)
                .setGroup(channel)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                // Set the intent that will fire when the user taps the notification
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);

        // If message content is long enough, make it expandable
        if (content.length() > 64) {
            builder.setStyle(new NotificationCompat.BigTextStyle().bigText(content));
        }

        int id_group = channel.hashCode();

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(reactContext.getApplicationContext());

        notificationManager.notify(id_group, groupBuilder.build());
        notificationManager.notify(id_message, builder.build());
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
