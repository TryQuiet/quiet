package com.zbaymobile;

import android.util.JsonReader;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.zbaymobile.Utils.Const;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.ThreadLocalRandom;

public class NotificationModule extends ReactContextBaseJavaModule {

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

    public static void notify(String channelName, String message) {
        if (!channelName.equals("_NOTIFICATION_")) return;

        String channelAddress;
        String messageContent;

        try {
            JSONObject json = new JSONObject(message);
            JSONArray payload = new JSONArray(json.getString("payload"));
            JSONObject data = new JSONObject(payload.getString(0));
            channelAddress = data.getString("channelAddress");
            messageContent = data.getString("message");
        } catch (JSONException e) {
            Log.e("NOTIFICATION", "unexpected JSON exception", e);
            return;
        }

        String title = String.format("#%s", channelAddress);
        String text;

        if (messageContent.length() > 32) {
            text = String.format("%s...", messageContent.substring(0, 32));
        } else {
            text = messageContent;
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
}
