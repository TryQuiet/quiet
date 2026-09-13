package org.quiet.connectiondriver;

import android.app.Activity;
import android.app.Instrumentation;
import android.app.UiAutomation;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Intent;
import android.graphics.Rect;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/** Drives visible UI on a dedicated emulator; never instruments Quiet's process. */
public final class Driver extends Instrumentation {
    private Bundle arguments;
    private UiAutomation ui;
    private String expectedPackage = "com.quietmobile";
    @Override public void onCreate(Bundle args) { arguments = args; start(); }

    private static double now() { return SystemClock.elapsedRealtimeNanos() / 1e9; }
    private static String text(CharSequence value) { return value == null ? "" : value.toString(); }
    private List<AccessibilityNodeInfo> nodes() {
        List<AccessibilityNodeInfo> found = new ArrayList<>();
        AccessibilityNodeInfo root = ui.getRootInActiveWindow();
        if (root != null && expectedPackage.equals(text(root.getPackageName()))) collect(root, found);
        return found;
    }
    private void collect(AccessibilityNodeInfo node, List<AccessibilityNodeInfo> found) {
        if (node.isVisibleToUser()) found.add(node);
        for (int n = 0; n < node.getChildCount(); n++) {
            AccessibilityNodeInfo child = node.getChild(n);
            if (child != null) collect(child, found);
        }
    }
    private AccessibilityNodeInfo waitFor(String value, double timeout) {
        double deadline = now() + timeout;
        do {
            for (AccessibilityNodeInfo node : nodes()) {
                if (value.equals(text(node.getText())) || value.equals(text(node.getContentDescription()))
                    || value.equals(node.getViewIdResourceName())) return node;
            }
            SystemClock.sleep(75);
        } while (now() < deadline);
        throw new IllegalStateException("Expected UI element did not appear: " + value);
    }
    private void click(String value) {
        // IME dismissal can remove its accessibility window before the app's
        // resize animation ends. Tap only after the target's bounds settle.
        double deadline = now() + 240;
        Rect previous = new Rect();
        int stable = 0;
        do {
            AccessibilityNodeInfo node = waitFor(value, Math.max(.1, deadline - now()));
            Rect current = new Rect(); node.getBoundsInScreen(current);
            stable = node.isEnabled() && !current.isEmpty() && current.equals(previous) ? stable + 1 : 0;
            if (stable >= 2) { touch(node); return; }
            previous.set(current);
            SystemClock.sleep(100);
        } while (now() < deadline);
        throw new IllegalStateException("UI target never settled: " + value);
    }
    private void touch(AccessibilityNodeInfo node) {
        Rect bounds = new Rect(); node.getBoundsInScreen(bounds);
        if (bounds.isEmpty()) throw new IllegalStateException("UI element has no touch bounds");
        long time = SystemClock.uptimeMillis();
        MotionEvent down = MotionEvent.obtain(time, time, MotionEvent.ACTION_DOWN, bounds.centerX(), bounds.centerY(), 0);
        MotionEvent up = MotionEvent.obtain(time, time + 30, MotionEvent.ACTION_UP, bounds.centerX(), bounds.centerY(), 0);
        down.setSource(InputDevice.SOURCE_TOUCHSCREEN); up.setSource(InputDevice.SOURCE_TOUCHSCREEN);
        try {
            if (!ui.injectInputEvent(down, true) || !ui.injectInputEvent(up, true))
                throw new IllegalStateException("Native touch injection failed");
        } finally { down.recycle(); up.recycle(); }
    }
    private boolean keyboardVisible() {
        for (AccessibilityWindowInfo window : ui.getWindows())
            if (window.getType() == AccessibilityWindowInfo.TYPE_INPUT_METHOD) return true;
        return false;
    }
    private void settleKeyboard() {
        try { ui.waitForIdle(100, 2000); } catch (java.util.concurrent.TimeoutException ignored) { }
        // Back on an absent keyboard would navigate away from the join screen.
        if (!keyboardVisible()) return;
        long time = SystemClock.uptimeMillis();
        ui.injectInputEvent(new KeyEvent(time, time, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_BACK,
            0, 0, -1, 0, KeyEvent.FLAG_FROM_SYSTEM, InputDevice.SOURCE_KEYBOARD), true);
        ui.injectInputEvent(new KeyEvent(time, time + 30, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_BACK,
            0, 0, -1, 0, KeyEvent.FLAG_FROM_SYSTEM, InputDevice.SOURCE_KEYBOARD), true);
        double deadline = now() + 3;
        while (keyboardVisible() && now() < deadline) SystemClock.sleep(75);
        if (keyboardVisible()) throw new IllegalStateException("Keyboard did not close");
        try { ui.waitForIdle(250, 2000); } catch (java.util.concurrent.TimeoutException ignored) { }
    }
    private void enter(String value) {
        List<AccessibilityNodeInfo> inputs = new ArrayList<>();
        for (AccessibilityNodeInfo node : nodes())
            if ("android.widget.EditText".equals(text(node.getClassName()))) inputs.add(node);
        if (inputs.size() != 1) throw new IllegalStateException("Expected one visible native text field");
        // React Native uses focus events to expose the send controls. A raw
        // accessibility text replacement without touching the field skips that.
        touch(inputs.get(0));
        Bundle argument = new Bundle();
        argument.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, value);
        if (!inputs.get(0).performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, argument))
            throw new IllegalStateException("Native text entry failed");
        double deadline = now() + 10;
        do {
            for (AccessibilityNodeInfo node : nodes())
                if ("android.widget.EditText".equals(text(node.getClassName())) && value.equals(text(node.getText()))) {
                    settleKeyboard(); return;
                }
            SystemClock.sleep(75);
        } while (now() < deadline);
        throw new IllegalStateException("Native text entry was not acknowledged");
    }
    @Override public void onStart() {
        JSONObject result = new JSONObject();
        Bundle response = new Bundle();
        double start = now();
        try {
            ui = getUiAutomation();
            AccessibilityServiceInfo service = ui.getServiceInfo();
            service.flags |= AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS | AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
            ui.setServiceInfo(service);
            JSONObject request = new JSONObject(arguments.getString("request"));
            String action = request.getString("action");
            if (action.equals("selftest")) {
                expectedPackage = "org.quiet.connectiondriver";
                Intent intent = new Intent(getTargetContext(), ProbeActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivitySync(intent);
                waitFor("Driver echo", 10);
                String literal = "quiet://a?x=1&y=two words 'quoted' café";
                enter(literal); click("Driver echo"); waitFor("Echo: " + literal, 10);
                result.put("nativeTextAndClickVerified", true);
            } else if (action.equals("join")) {
                waitFor("Join community", 240);
                enter(request.getString("invitation")); click("Continue");
                waitFor("Register a username", 240);
                enter(request.getString("username"));
                double joinStart = now(); click("Continue");
                waitFor("Agree & Continue", 240); click("Agree & Continue");
                waitFor("channels_list", 240);
                result.put("joinSeconds", now() - joinStart);
            } else if (action.equals("general")) {
                click("channel_tile_general"); waitFor("chat_general", 30);
            } else if (action.equals("input")) {
                enter(request.getString("text"));
            } else if (action.equals("wait")) {
                AccessibilityNodeInfo node = waitFor(request.getString("value"), request.optDouble("timeoutSeconds", 120));
                Rect bounds = new Rect(); node.getBoundsInScreen(bounds);
                result.put("bounds", "[" + bounds.left + "," + bounds.top + "][" + bounds.right + "," + bounds.bottom + "]");
            } else throw new IllegalArgumentException("Unsupported driver action");
            result.put("passed", true);
            result.put("wholeUiSeconds", now() - start);
            response.putString("result", result.toString());
            finish(Activity.RESULT_OK, response);
        } catch (Throwable error) {
            try { result.put("passed", false).put("error", error.toString()).put("wholeUiSeconds", now() - start); }
            catch (Exception ignored) { }
            response.putString("result", result.toString());
            finish(Activity.RESULT_CANCELED, response);
        }
    }
}
