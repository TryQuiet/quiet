package com.zbaymobile;

import android.app.ActivityManager;
import android.content.Context;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.zbaymobile.Utils.Const;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

public class NotificationModule extends ReactContextBaseJavaModule {

    private static final String SYSTEM_CHANNEL = "_SYSTEM_";
    private static final String BASE_NOTIFICATION_CHANNEL = "_BASE_NOTIFICATION_";
    private static final String RICH_NOTIFICATION_CHANNEL = "_RICH_NOTIFICATION_";

    private static ReactApplicationContext reactContext;

    @NonNull
    @Override
    public String getName() {
        return "NotificationModule";
    }

    public NotificationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @ReactMethod
    public static void notify(String channelName, String message) {
        if (channelName.equals(SYSTEM_CHANNEL)) return; // Ignore system messages
        if (!channelName.equals(RICH_NOTIFICATION_CHANNEL) && isAppOnForeground()) return; // Only RICH_NOTIFICATION can be shown in foreground

        JSONObject data; // Message payload

        String title = "Quiet";
        String text = "";

        try {
            JSONObject json = new JSONObject(message);
            JSONArray payload = new JSONArray(json.getString("payload"));
            data = new JSONObject(payload.getString(0));
        } catch (JSONException e) {
            Log.e("NOTIFICATION", "unexpected JSON exception", e);
            return;
        }

        if (channelName.equals(BASE_NOTIFICATION_CHANNEL)) {
            try {
                String channelAddress = data.getString("channelAddress");
                title = "Quiet";
                text = String.format("You have a message in #%s", channelAddress);
            } catch (JSONException e) {
                Log.e("NOTIFICATION", "incorrect BASE_NOTIFICATION payload", e);
                return;
            }
        }

        if(channelName.equals(RICH_NOTIFICATION_CHANNEL)) {
            try {
                String channelAddress = data.getString("channelAddress");
                String messageContent = data.getString("message");
                title = String.format("#%s", channelAddress);
                text = truncate(messageContent, 32);
            } catch (JSONException e) {
                Log.e("NOTIFICATION", "incorrect RICH_NOTIFICATION payload", e);
                return;
            }
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext.getApplicationContext(), Const.INCOMING_MESSAGES_CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(text)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);

        Integer notificationId = ThreadLocalRandom.current().nextInt(0, 9000 + 1);

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

    private static String truncate(String message, Integer length) {
        if (message.length() > length) {
            return String.format("%s...", message.substring(0, length));
        } else {
            return message;
        }
    }
}
