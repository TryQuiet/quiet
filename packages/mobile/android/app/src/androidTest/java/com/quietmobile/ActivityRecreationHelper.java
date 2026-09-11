package com.quietmobile;

import android.app.Activity;
import android.app.Application;
import android.app.Instrumentation;
import android.os.Bundle;
import androidx.fragment.app.Fragment;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.runner.lifecycle.ActivityLifecycleMonitorRegistry;
import androidx.test.runner.lifecycle.Stage;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;

/** Invoked by Detox only; this class is excluded from production APKs. */
public final class ActivityRecreationHelper {
    private ActivityRecreationHelper() {}

    public static String recreateCurrentActivity() throws Exception {
        Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        Application application = (Application) instrumentation.getTargetContext().getApplicationContext();
        AtomicReference<MainActivity> original = new AtomicReference<>();
        AtomicReference<Activity> recreated = new AtomicReference<>();
        AtomicInteger screenFragments = new AtomicInteger();
        AtomicBoolean hasSavedInstanceState = new AtomicBoolean();
        CountDownLatch resumed = new CountDownLatch(1);

        instrumentation.runOnMainSync(() -> {
            for (Activity activity : ActivityLifecycleMonitorRegistry.getInstance().getActivitiesInStage(Stage.RESUMED)) {
                if (activity instanceof MainActivity) {
                    original.set((MainActivity) activity);
                    for (Fragment fragment : ((MainActivity) activity).getSupportFragmentManager().getFragments()) {
                        if (fragment.getClass().getName().startsWith("com.swmansion.rnscreens.")) {
                            screenFragments.incrementAndGet();
                        }
                    }
                }
            }
        });
        if (original.get() == null || screenFragments.get() == 0) {
            throw new IllegalStateException("Open a native-stack screen before testing activity recreation");
        }

        Application.ActivityLifecycleCallbacks callbacks = new Application.ActivityLifecycleCallbacks() {
            @Override public void onActivityCreated(Activity activity, Bundle state) {
                if (activity instanceof MainActivity && activity != original.get()) {
                    recreated.set(activity);
                    hasSavedInstanceState.set(state != null);
                }
            }
            @Override public void onActivityResumed(Activity activity) {
                if (activity == recreated.get()) resumed.countDown();
            }
            @Override public void onActivityStarted(Activity activity) {}
            @Override public void onActivityPaused(Activity activity) {}
            @Override public void onActivityStopped(Activity activity) {}
            @Override public void onActivitySaveInstanceState(Activity activity, Bundle state) {}
            @Override public void onActivityDestroyed(Activity activity) {}
        };

        instrumentation.runOnMainSync(() -> application.registerActivityLifecycleCallbacks(callbacks));
        try {
            instrumentation.runOnMainSync(() -> original.get().recreate());
            if (!resumed.await(30, TimeUnit.SECONDS)) {
                throw new IllegalStateException("A new MainActivity did not resume after Activity.recreate()");
            }
            return new JSONObject()
                    .put("originalActivity", System.identityHashCode(original.get()))
                    .put("recreatedActivity", System.identityHashCode(recreated.get()))
                    .put("hasSavedInstanceState", hasSavedInstanceState.get())
                    .put("screenFragments", screenFragments.get())
                    .toString();
        } finally {
            instrumentation.runOnMainSync(() -> application.unregisterActivityLifecycleCallbacks(callbacks));
        }
    }
}
