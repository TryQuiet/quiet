package com.zbaymobile;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.zbaymobile.Utils.Const;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

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
        NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext.getApplicationContext(), Const.INCOMING_MESSAGES_CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(channelName)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);

        Integer notificationId = ThreadLocalRandom.current().nextInt(0, 9000 + 1);

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(reactContext.getApplicationContext());
        notificationManager.notify(notificationId, builder.build());
    }
}
