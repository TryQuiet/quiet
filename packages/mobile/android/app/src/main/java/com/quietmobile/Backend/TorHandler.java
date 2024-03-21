/**
 * The code in this file is from
 * https://github.com/guardianproject/tor-android/blob/56c5105b6e12748a388778d0bbb36fb85c295f4b/tor-android-binary/src/main/java/org/torproject/jni/TorService.java
 * and is licensed under external-licenses/tor-android.license.txt.
 *
 * This code has been modified to work with Tor control port instead
 * of control socket.
 */
package com.quietmobile.Backend;

import static android.content.Context.MODE_PRIVATE;

import android.content.Context;
import android.os.FileObserver;
import android.os.Process;
import android.util.Log;

import androidx.annotation.Nullable;

import com.quietmobile.Utils.Utils;

import net.freehaven.tor.control.TorControlCommands;
import net.freehaven.tor.control.TorControlConnection;

import java.io.File;
import java.io.FileDescriptor;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;


public class TorHandler {

    static {
        System.loadLibrary("tor");
        System.loadLibrary("tor-wrapper");
    }

    private static final boolean ENABLE_CONTROL_SOCKET = false;

    private static final String CONTROL_SOCKET_NAME = "ControlSocket";

    private final Context context;

    public TorHandler(Context applicationContext) {
        this.context = applicationContext;
    }

    public int controlPort = -1;
    public int socksPort = -1;
    public int httpTunnelPort = -1;

    public static final String TAG = "TorHandler";

    /**
     * @return a {@link File} pointing to the location of the optional
     * {@code torrc} file.
     * @see <a href="https://www.torproject.org/docs/tor-manual.html#_the_configuration_file_format">Tor configuration file format</a>
     */
    public static File getTorrc(Context context) {
        return new File(getAppTorHandlerDir(context), "torrc");
    }

    /**
     * @return a {@link File} pointing to the location of the optional
     * {@code torrc-defaults} file.
     * @see <a href="https://www.torproject.org/docs/tor-manual.html#_the_configuration_file_format">Tor configuration file format</a>
     */
    public static File getDefaultsTorrc(Context context) {
        return new File(getAppTorHandlerDir(context), "torrc-defaults");
    }

    private static File getControlSocket(Context context) {
        if (controlSocket == null) {
            controlSocket = new File(getAppTorHandlerDataDir(context), CONTROL_SOCKET_NAME);
        }
        return controlSocket;
    }

    /**
     * Get the directory that {@link TorHandler} uses for:
     * <ul>
     * <li>writing {@code ControlPort.txt} // TODO
     * <li>reading {@code torrc} and {@code torrc-defaults}
     * <li>{@code DataDirectory} and {@code CacheDirectory}
     * <li>the debug log file
     * </ul>
     */
    private static File getAppTorHandlerDir(Context context) {
        if (appTorHandlerDir == null) {
            appTorHandlerDir = context.getDir("AppTorHandler", MODE_PRIVATE);
        }
        return appTorHandlerDir;
    }

    /**
     * Tor stores private, internal data in this directory.
     */
    private static File getAppTorHandlerDataDir(Context context) {
        File dir = new File(getAppTorHandlerDir(context), "data");
        dir.mkdir();
        if (!(dir.setReadable(true, true) && dir.setWritable(true, true) && dir.setExecutable(true, true))) {
            throw new IllegalStateException("Cannot create " + dir);
        }
        return dir;
    }

    @Nullable
    private Path getAuthCookiePath() {
        String dataDirectoryPath = getAppTorHandlerDataDir(context).getPath();
        return Paths.get(dataDirectoryPath, "control_auth_cookie");
    }

    private void removeAuthCookie() {
        Path path = getAuthCookiePath();
        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            Log.i("QUIET_TOR", "Cannot remove auth cookie", e);
        }
    }

    @Nullable
    public String getAuthCookie() {
        String hex = null;
        try {
            Path path = getAuthCookiePath();
            hex = Utils.readFileAsHex(path);
        } catch (IOException e) {
            Log.e("QUIET_TOR", "Cannot get auth cookie path", e);
        }
        return hex;
    }

    private static File appTorHandlerDir = null;
    private static File controlSocket = null;

    // Store the opaque reference as a long (pointer) for the native code
    @SuppressWarnings({"FieldMayBeFinal", "unused"})
    private long torConfiguration = -1;
    @SuppressWarnings({"FieldMayBeFinal"," unused"})
    private int torControlFd = -1;

    private volatile TorControlConnection torControlConnection;

    /**
     * This lock must be acquired before calling createTorConfiguration() and
     * held until mainConfigurationFree() has been called.
     */
    private static final ReentrantLock runLock = new ReentrantLock();

    private native boolean createTorConfiguration();

    private native void mainConfigurationFree();

    private native static FileDescriptor prepareFileDescriptor(String path);
    private native boolean mainConfigurationSetCommandLine(String[] args);

    private native boolean mainConfigurationSetupControlSocket();

    private native int runMain();

    /**
     * This waits for {@link #CONTROL_SOCKET_NAME} to be created by {@code tor},
     * then continues on to connect to the {@code ControlSocket} as described in
     * {@link #getControlSocket(Context)}.  As a failsafe, this will only wait
     * 10 seconds, after that it will check whether the {@code ControlSocket}
     * file exists, and if not, throw a {@link IllegalStateException}.
     */
    private final Thread controlPortThread = new Thread(CONTROL_SOCKET_NAME) {
        @Override
        public void run() {
             android.os.Process.setThreadPriority(Process.THREAD_PRIORITY_BACKGROUND);
            try {
                final CountDownLatch countDownLatch = new CountDownLatch(1);
                final String observeDir = getAppTorHandlerDataDir(context).getAbsolutePath();
                FileObserver controlPortFileObserver = new FileObserver(observeDir) {
                    @Override
                    public void onEvent(int event, @Nullable String name) {
                        if ((event & FileObserver.CREATE) > 0 && CONTROL_SOCKET_NAME.equals(name)) {
                            countDownLatch.countDown();
                        }
                    }
                };
                controlPortFileObserver.startWatching();
                controlPortThreadStarted.countDown();
                countDownLatch.await(10, TimeUnit.SECONDS);
                controlPortFileObserver.stopWatching();
                File controlSocket = new File(observeDir, CONTROL_SOCKET_NAME);
                if (!controlSocket.canRead()) {
                    throw new IOException("cannot read " + controlSocket);
                }

                FileDescriptor controlSocketFd = prepareFileDescriptor(getControlSocket(context).getAbsolutePath());
                InputStream is = new FileInputStream(controlSocketFd);
                OutputStream os = new FileOutputStream(controlSocketFd);
                torControlConnection = new TorControlConnection(is, os);
                torControlConnection.launchThread(true);
                torControlConnection.authenticate(new byte[0]);
                torControlConnection.setEvents(Collections.singletonList(TorControlCommands.EVENT_CIRCUIT_STATUS));

            } catch (IOException | ArrayIndexOutOfBoundsException | InterruptedException e) {
                e.printStackTrace();
            }
        }
    };

    private volatile CountDownLatch controlPortThreadStarted;

    private final Thread torThread = new Thread("tor") {
        @Override
        public void run() {
            try {
                /*
                  Prevent services hooking up on a control port
                  from possibly using stale auth cookie generated with previous run.
                 */
                removeAuthCookie();

                createTorConfiguration();

                ArrayList<String> lines = new ArrayList<>(Arrays.asList("tor", "--verify-config", // must always be here
                        "--RunAsDaemon", "0",
                        "-f", getTorrc(context).getAbsolutePath(),
                        "--defaults-torrc", getDefaultsTorrc(context).getAbsolutePath(),
                        "--ignore-missing-torrc",
                        "--SyslogIdentityTag", TAG,
                        "--CacheDirectory", new File(context.getCacheDir(), TAG).getAbsolutePath(),
                        "--DataDirectory", getAppTorHandlerDataDir(context).getAbsolutePath(),
                        "--ControlPort", String.valueOf(controlPort),
                        "--SOCKSPort", String.valueOf(socksPort),
                        "--HTTPTunnelPort", String.valueOf(httpTunnelPort),
                        "--CookieAuthentication", "1",
                        "--LogMessageDomains", "1",
                        "--TruncateLogFile", "1"
                ));

                if (ENABLE_CONTROL_SOCKET) {
                    lines.addAll(Arrays.asList(
                            "--ControlSocket", getControlSocket(context).getAbsolutePath()
                    ));
                }

                String[] verifyLines = lines.toArray(new String[0]);
                if (!mainConfigurationSetCommandLine(verifyLines)) {
                    throw new IllegalArgumentException("Setting command line failed: " + Arrays.toString(verifyLines));
                }

                int result = runMain(); // run verify
                if (result != 0) {
                    throw new IllegalArgumentException("Bad command flags: " + Arrays.toString(verifyLines));
                }

                if (ENABLE_CONTROL_SOCKET) {
                    controlPortThreadStarted = new CountDownLatch(1);
                    controlPortThread.start();
                    controlPortThreadStarted.await();
                }

                String[] runLines = new String[lines.size() - 1];
                runLines[0] = "tor";
                for (int i = 2; i < lines.size(); i++) {
                    runLines[i - 1] = lines.get(i);
                }
                if (!mainConfigurationSetCommandLine(runLines)) {
                    throw new IllegalArgumentException("Setting command line failed: " + Arrays.toString(runLines));
                }
                if (ENABLE_CONTROL_SOCKET && !mainConfigurationSetupControlSocket()) {
                    throw new IllegalStateException("Setting up ControlPort failed!");
                }
                if (runMain() != 0) {
                    throw new IllegalStateException("Tor could not start!");
                }

            } catch (IllegalStateException | IllegalArgumentException | InterruptedException e) {
                e.printStackTrace();
            } finally {
                mainConfigurationFree();
                runLock.unlock();
            }
        }
    };

    /**
     * Start Tor in a {@link Thread} with the minimum required config.  The
     * rest of the config should happen via the Control Port.  First Tor
     * runs with {@code --verify-config} to check the command line flags and
     * any {@code torrc} config. Then finally Tor is
     * started in its own {@code Thread}.
     * <p>
     * Tor daemon does not output early debug messages to logcat, only after it
     * tries to connect to the ports.  So it is important that Tor does not run
     * into port conflicts when first starting.
     *
     * @see <a href="https://trac.torproject.org/projects/tor/ticket/32036">#32036  output debug logs to logcat as early as possible on Android</a>
     * @see <a href="https://github.com/torproject/tor/blob/40be20d542a83359ea480bbaa28380b4137c88b2/src/app/config/config.c#L4730">options that must be on the command line</a>
     */
    public void startTorThread() {
        if (runLock.isLocked()) {
            Log.i(TAG, "Waiting for lock");
        }
        runLock.lock();
        Log.i(TAG, "Acquired lock");
        torThread.start();
    }

}
