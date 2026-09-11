package com.quietmobile;

import android.app.Instrumentation;
import android.content.Intent;
import android.os.Bundle;
import androidx.test.platform.app.InstrumentationRegistry;

/** Test APK only: deliver the same bundled channel as a tapped notification. */
public final class NotificationIntentHelper {
    private NotificationIntentHelper() {}

    public static void deliverNotification() {
        Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        Bundle notification = new Bundle();
        notification.putString("channel", "quiet-test-channel");
        Intent intent = new Intent(instrumentation.getTargetContext(), MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("notification", notification);
        instrumentation.getTargetContext().startActivity(intent);
    }
}
