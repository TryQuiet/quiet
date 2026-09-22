package com.quietmobile;

import static org.junit.Assert.*;

import android.content.Context;
import android.os.Bundle;
import android.os.Process;
import android.os.SystemClock;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.work.testing.TestListenableWorkerBuilder;
import com.quietmobile.Backend.BackendWorker;
import com.quietmobile.Backend.NodeProjectManager;
import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.junit.Assume;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Real embedded Node and addon test; deliberately starts no Activity or Detox session. */
@RunWith(AndroidJUnit4.class)
public final class EmbeddedNodeDatabaseTest {
    private static final String ENTRY = "embedded-node-database-android.cjs";
    private static final String HELPER = "embedded-node-database.cjs";

    private static String sha256(byte[] bytes) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
        StringBuilder text = new StringBuilder();
        for (byte value : digest) text.append(String.format("%02x", value & 0xff));
        return text.toString();
    }

    private static String sha256(InputStream input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[16384];
        int count;
        while ((count = input.read(buffer)) != -1) digest.update(buffer, 0, count);
        StringBuilder text = new StringBuilder();
        for (byte value : digest.digest()) text.append(String.format("%02x", value & 0xff));
        return text.toString();
    }

    private static void copyTestAsset(Context instrumentation, String name, File directory) throws Exception {
        try (InputStream input = instrumentation.getAssets().open(name)) {
            Files.copy(input, new File(directory, name).toPath(), StandardCopyOption.REPLACE_EXISTING);
        }
    }

    @Test
    public void embeddedNodePersistsDatabase() throws Exception {
        Bundle arguments = InstrumentationRegistry.getArguments();
        // Normal Detox discovers every instrumentation test. This native smoke
        // is opt-in; malformed arguments to an explicit invocation still fail.
        Assume.assumeTrue("Dedicated embedded Node invocation only", arguments.containsKey("quietEmbeddedNodeRunId"));
        String runId = arguments.getString("quietEmbeddedNodeRunId", "");
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertTrue("Use only the Storybook debug app", BuildConfig.DEBUG && context.getPackageName().equals("com.quietmobile.storybook.debug"));
        assertTrue("Supply a public run ID", runId.matches("[a-z0-9][a-z0-9_-]{0,63}"));
        int launch = Integer.parseInt(arguments.getString("quietEmbeddedNodeLaunch", "0"));
        assertTrue("Run exactly launch 1 or 2", launch == 1 || launch == 2);
        File result = new File(context.getFilesDir(), "quiet-embedded-node-smoke/" + runId + "/result.json");
        if (launch == 1) assertFalse("First launch needs a fresh run ID", result.exists());
        else assertTrue("Second launch requires a prior verdict", result.isFile());

        // Exercise the real app's asset copier before constructing the worker.
        NodeProjectManager project = new NodeProjectManager(context);
        project.init();
        project.waitForInit();
        File projectDirectory = new File(project.getProjectPath());
        File productionBundle = new File(projectDirectory, "bundle.cjs");
        String bundleBefore = sha256(Files.readAllBytes(productionBundle.toPath()));
        File fixtureDirectory = new File(projectDirectory, "quiet-embedded-node-smoke/" + runId);
        assertTrue("Create dedicated fixture directory", fixtureDirectory.isDirectory() || fixtureDirectory.mkdirs());
        Context instrumentation = InstrumentationRegistry.getInstrumentation().getContext();
        copyTestAsset(instrumentation, ENTRY, fixtureDirectory);
        copyTestAsset(instrumentation, HELPER, fixtureDirectory);
        File addon = new File(projectDirectory, "arm64/classic-level/classic_level.node");
        String addonHash = sha256(Files.readAllBytes(addon.toPath()));
        try (InputStream packagedAddon = context.getAssets().open("nodejs-project/arm64/classic-level/classic_level.node")) {
            assertEquals("Use the unchanged packaged addon", sha256(packagedAddon), addonHash);
        }

        // The WorkManager testing API supplies WorkerParameters only. BackendWorker,
        // its JNI methods, libnode, rn_bridge and the classic-level binary are real.
        BackendWorker worker = TestListenableWorkerBuilder.from(context, BackendWorker.class).build();
        String input = "quiet-embedded-node-smoke/" + runId + "/" + ENTRY
                + " --quiet-run-id " + runId + " --quiet-launch " + launch
                + " --quiet-files " + context.getFilesDir().getAbsolutePath()
                + " --quiet-project " + projectDirectory.getAbsolutePath()
                + " --quiet-addon-sha256 " + addonHash;
        assertFalse("Native argv paths must not contain spaces", context.getFilesDir().getAbsolutePath().contains(" "));
        AtomicReference<Throwable> failure = new AtomicReference<>();
        Thread node = new Thread(() -> {
            try {
                worker.startNodeProjectWithArguments(input, context.getFilesDir().getAbsolutePath());
                failure.set(new IllegalStateException("Embedded Node returned before process termination"));
            } catch (Throwable error) {
                failure.set(error);
            }
        }, "quiet-embedded-node-database");
        node.setDaemon(true);
        node.start();

        JSONObject verdict = null;
        long deadline = SystemClock.elapsedRealtime() + 90000;
        while (SystemClock.elapsedRealtime() < deadline) {
            if (failure.get() != null) fail("Native launcher failed: " + failure.get().getClass().getSimpleName());
            if (result.isFile()) {
                assertTrue("Verdict must stay bounded", result.length() < 16384);
                JSONObject candidate = new JSONObject(new String(Files.readAllBytes(result.toPath()), StandardCharsets.UTF_8));
                if (candidate.optInt("pid") == Process.myPid() && !candidate.optString("status").equals("running")) {
                    verdict = candidate;
                    break;
                }
            }
            SystemClock.sleep(100);
        }
        assertNotNull("Embedded Node produced no completed verdict", verdict);
        assertEquals("Embedded smoke failed at stage " + verdict.optString("stage"), "pass", verdict.getString("status"));
        assertEquals("24.18.0", verdict.getString("node"));
        assertEquals("android", verdict.getString("platform"));
        assertEquals("arm64", verdict.getString("architecture"));
        assertEquals("137", verdict.getString("modules"));
        assertTrue(verdict.getInt("napi") >= 3);
        assertEquals(Process.myPid(), verdict.getInt("pid"));
        assertEquals(launch, verdict.getInt("launch"));
        assertTrue(verdict.getBoolean("nativeBridge"));
        assertTrue(verdict.getBoolean("bridgeRoundTrip"));
        assertEquals(addonHash, verdict.getString("addonSha256"));
        JSONObject database = verdict.getJSONObject("database");
        assertEquals(launch == 1, database.getBoolean("created"));
        assertEquals(launch == 1 ? 8 : 0, database.getInt("rowsWritten"));
        assertEquals(16, database.getInt("rowsRead"));
        assertEquals(8, database.getInt("forwardRows"));
        assertEquals(8, database.getInt("reverseRows"));
        assertEquals(2, database.getInt("openCloseCycles"));
        assertTrue(database.getInt("tableFiles") > 0);
        if (launch == 2) assertNotEquals(verdict.getInt("pid"), verdict.getInt("previousPid"));
        assertEquals("Production backend bundle stays unchanged", bundleBefore, sha256(Files.readAllBytes(productionBundle.toPath())));
        // Instrumentation ends this app process. The runner force-stops it before
        // relaunch; never call process.exit() inside an embedded Node runtime.
    }
}
