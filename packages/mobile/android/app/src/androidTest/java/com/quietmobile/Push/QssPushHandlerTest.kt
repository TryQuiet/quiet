package com.quietmobile.Push

import android.Manifest
import android.app.Notification
import android.app.NotificationManager
import android.content.Context
import android.content.ContextWrapper
import android.content.pm.PackageManager
import android.os.Build
import android.os.SystemClock
import android.service.notification.StatusBarNotification
import android.util.Base64
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.apicatalog.base.Base58 as CopperBase58
import com.facebook.react.bridge.BridgeReactContext
import com.google.firebase.messaging.RemoteMessage
import com.goterl.lazysodium.LazySodiumAndroid
import com.goterl.lazysodium.SodiumAndroid
import com.quietmobile.BuildConfig
import com.quietmobile.Communication.CommunicationModule
import com.quietmobile.Utils.Const
import okhttp3.mockwebserver.Dispatcher
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.RecordedRequest
import org.json.JSONArray
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

/**
 * Controlled native integration tests: credentials and encrypted log entries are fixed fixtures,
 * QSS HTTP responses come from MockWebServer, and RemoteMessage callbacks are injected locally.
 * Service gates, secure storage, proof signing, message decryption and OS notification posting are
 * production code. These tests do not cover UI enrollment, Firebase transport or OS service launch.
 * Run only on a disposable installation: setup/teardown clear this app's native push storage.
 */
@RunWith(AndroidJUnit4::class)
class QssPushHandlerTest {
    private val server = MockWebServer()
    // The production service caches auth clients by URL, even across service instances.
    private val fixturePath = "/native-${UUID.randomUUID()}/"
    private val requests = mutableListOf<String>()
    private var serverFailure: Throwable? = null
    private lateinit var context: Context
    private lateinit var notificationManager: NotificationManager
    private val challengeTimeMs = System.currentTimeMillis()
    private var logSequence = 1L
    private var failNextLogFetch = false
    private var serverStarted = false
    private var nativeStoragePrepared = false

    @Before
    fun setUp() {
        context = ApplicationProvider.getApplicationContext()
        notificationManager = context.getSystemService(NotificationManager::class.java)
        assertEquals("Build with .env.e2e.qss or .env.e2e.qss.only", "true", BuildConfig.QSS_ALLOWED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            assertEquals(
                "Grant POST_NOTIFICATIONS before starting instrumentation",
                PackageManager.PERMISSION_GRANTED,
                context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS),
            )
        }
        assertTrue("Notifications must be enabled for the disposable test app", notificationManager.areNotificationsEnabled())
        assertNotNull(notificationManager.getNotificationChannel(Const.INCOMING_MESSAGES_CHANNEL_ID))
        notificationManager.cancelAll()
        QuietStorage.init(context)
        QuietStorage.clearAll()
        nativeStoragePrepared = true
        server.dispatcher = fixedQssDispatcher()
        server.start()
        serverStarted = true
        seedNativeStorage()
    }

    private fun seedNativeStorage(
        includeCredentials: Boolean = true,
        includeProfile: Boolean = true,
        includeUserKey: Boolean = true,
    ) {
        if (includeCredentials) {
            QuietStorage.saveDeviceCredentials(DEVICE_ID, TEAM_ID, DEVICE_SEED_BASE58, "self-id")
        }
        QuietStorage.addLfaKey("quiet_${TEAM_ID}_TEAM_TEAM_0_secret", OUTER_TEAM_SECRET)
        QuietStorage.addLfaKey("quiet_${TEAM_ID}_ROLE_MEMBER_0_secret", INNER_ROLE_SECRET)
        if (includeUserKey) {
            QuietStorage.addLfaKey("quiet_${TEAM_ID}_USER_user-1_0_userSig", USER_PUBLIC_KEY_BASE58)
        }
        QuietStorage.addChannelMetadata(TEAM_ID, "channel-1", "general")
        if (includeProfile) QuietStorage.saveUserMetadata("user-1", "Alice")
        QuietStorage.saveQssConfiguration(TEAM_ID, server.url(fixturePath).toString(), QSS_SERVER_ID)
        QuietStorage.setTeamQssEnabled(true)
        // This is explicit native test arrangement, not a simulated Activity lifecycle event.
        QuietStorage.setAppForeground(false)
    }

    @After
    fun tearDown() {
        if (serverStarted) server.shutdown()
        if (nativeStoragePrepared) QuietStorage.clearAll()
        if (::notificationManager.isInitialized) notificationManager.cancelAll()
        assertNull("fixed QSS rejected a native request", serverFailure)
    }

    @Test
    fun fixedQssAuthenticatesDecryptsAndRendersBackgroundNotification() {
        val crypto = QssCryptoService()
        val auth =
            QssAuthService(
                client = QssNetworkClient(server.url(fixturePath).toString()),
                crypto = crypto,
                nowMs = { challengeTimeMs },
            )
        val notifications = mutableListOf<Pair<JSONObject, String>>()

        QssPushHandler(
            authService = auth,
            cryptoService = crypto,
            getLastSyncSeq = QuietStorage::getLastSyncSeq,
            saveLastSyncSeq = QuietStorage::saveLastSyncSeq,
            recordMissingNotificationKeyFailure = QuietStorage::recordMissingNotificationKeyFailure,
            clearMissingNotificationKeyFailure = QuietStorage::clearMissingNotificationKeyFailure,
            isAppForeground = QuietStorage::isAppForeground,
            getChannelName = QuietStorage::getChannelName,
            getNickname = QuietStorage::getNickname,
            getLocalUserId = QuietStorage::getLocalUserId,
            notify = { payload, nickname -> notifications += JSONObject(payload) to nickname },
        ).handle(TEAM_ID, QSS_SERVER_ID)

        assertNull("fixed QSS rejected the native request", serverFailure)
        assertEquals(listOf("challenge", "token", "logs:0"), requests)
        assertEquals(1L, QuietStorage.getLastSyncSeq(TEAM_ID))
        assertEquals(1, notifications.size)
        val (payload, nickname) = notifications.single()
        assertEquals("message-1", payload.getString("id"))
        assertEquals("channel-1", payload.getString("channelId"))
        assertEquals("hello from fixed QSS", payload.getString("message"))
        assertEquals("general", payload.getString("channelName"))
        assertEquals("Alice", nickname)
    }

    @Test
    fun servicePostsNamedChannelAndAuthenticatedSenderToAndroidNotificationManager() {
        QuietStorage.addChannelMetadata(TEAM_ID, "channel-1", "Release planning")

        receivePush()

        val child = awaitMessageNotification()
        assertEquals("Release planning", child.notification.extras.getCharSequence(Notification.EXTRA_TITLE).toString())
        assertEquals("@Alice: hello from fixed QSS", child.notification.extras.getCharSequence(Notification.EXTRA_TEXT).toString())
        assertEquals(context.packageName, child.notification.contentIntent.creatorPackage)
        assertEquals(1, messageNotifications().size)
        assertEquals(1L, QuietStorage.getLastSyncSeq(TEAM_ID))
        assertEquals(listOf("challenge", "token", "logs:0"), requests)
    }

    @Test
    fun serviceGatesRejectForegroundDisabledTeamAndMissingTeamBeforeAnyFetch() {
        QuietStorage.setAppForeground(true)
        receivePush()
        assertNoFetchOrMessage()

        QuietStorage.setAppForeground(false)
        QuietStorage.setTeamQssEnabled(false)
        receivePush()
        assertNoFetchOrMessage()

        QuietStorage.setTeamQssEnabled(true)
        receivePush(includeTeam = false)
        assertNoFetchOrMessage()

        receivePush()
        awaitMessageNotification()
        assertEquals(listOf("challenge", "token", "logs:0"), requests)
    }

    @Test
    fun missingNativePrerequisitesDeferWithoutAdvancingAndRecoverWhenStored() {
        QuietStorage.clearAll()
        seedNativeStorage(includeCredentials = false)
        receivePush()
        assertNoFetchOrMessage()

        QuietStorage.saveDeviceCredentials(DEVICE_ID, TEAM_ID, DEVICE_SEED_BASE58, "self-id")
        QuietStorage.saveQssConfiguration(TEAM_ID, "", "")
        receivePush()
        assertNoFetchOrMessage()

        QuietStorage.saveQssConfiguration(TEAM_ID, server.url(fixturePath).toString(), QSS_SERVER_ID)
        receivePush()
        awaitMessageNotification()
        assertEquals(1L, QuietStorage.getLastSyncSeq(TEAM_ID))
    }

    @Test
    fun selfMessagesWithCachedNamesAreConsumedWithoutOsNotification() {
        QuietStorage.saveDeviceCredentials(DEVICE_ID, TEAM_ID, DEVICE_SEED_BASE58, "user-1")

        receivePush()

        assertEquals(listOf("challenge", "token", "logs:0"), requests)
        assertEquals(1L, QuietStorage.getLastSyncSeq(TEAM_ID))
        assertNoMessageNotificationAfterCompletedCallback()
    }

    @Test
    fun unknownAuthorsAreConsumedWithoutOsNotification() {
        QuietStorage.clearAll()
        seedNativeStorage(includeProfile = false)

        receivePush()

        assertEquals(listOf("challenge", "token", "logs:0"), requests)
        assertEquals(1L, QuietStorage.getLastSyncSeq(TEAM_ID))
        assertNoMessageNotificationAfterCompletedCallback()
    }

    @Test
    fun peerWithSameNicknameAsLocalUserStillNotifies() {
        QuietStorage.saveUserMetadata("self-id", "Alice")

        receivePush()

        assertEquals("@Alice: hello from fixed QSS", awaitMessageNotification().notification.extras.getCharSequence(Notification.EXTRA_TEXT).toString())
        assertEquals(1L, QuietStorage.getLastSyncSeq(TEAM_ID))
    }

    @Test
    fun legacyQssUrlWithoutPinnedServerIdentityNeverFetches() {
        QuietStorage.saveQssConfiguration(TEAM_ID, "", "")
        // Reproduce the actual old-install storage format, without a pinned server identity.
        context.getSharedPreferences("quiet.storage", Context.MODE_PRIVATE).edit()
            .putString("quiet.nse.qssUrls", JSONObject().put(TEAM_ID, server.url(fixturePath).toString()).toString())
            .commit()
        assertNotNull(QuietStorage.getQssUrl(TEAM_ID))
        assertNull(QuietStorage.getQssServerId(TEAM_ID))

        receivePush()

        assertNoFetchOrMessage()
        QuietStorage.saveQssConfiguration(TEAM_ID, server.url(fixturePath).toString(), QSS_SERVER_ID)
        receivePush()
        awaitMessageNotification()
    }

    @Test
    fun backgroundBackendSyncCannotSkipTheNativeNotificationCursor() {
        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            // The native method needs a Context wrapper, not a running JS/Catalyst instance.
            CommunicationModule(BridgeReactContext(context)).saveNseLastSyncSeq(TEAM_ID, 1.0)
        }
        assertEquals(0L, QuietStorage.getLastSyncSeq(TEAM_ID))

        // Optional test-APK fault probe: reproduce the old background cursor race after checking
        // the actual bridge method. The real fetch then misses the message and the OS assertion
        // below must fail. This argument never changes a production source or shipping app flag.
        if (InstrumentationRegistry.getArguments().getString("quietNotificationTestFault") == "advance-background-cursor") {
            QuietStorage.saveLastSyncSeq(1, TEAM_ID)
        }
        receivePush()

        awaitMessageNotification()
        assertEquals(listOf("challenge", "token", "logs:0"), requests)
        assertEquals(1L, QuietStorage.getLastSyncSeq(TEAM_ID))
    }

    @Test
    fun repeatedWakeAndDuplicateSignedMessageDoNotRepostAnExistingNotification() {
        receivePush()
        val original = awaitMessageNotification()

        receivePush()
        assertEquals(listOf("challenge", "token", "logs:0", "logs:1"), requests)
        assertEquals(1L, QuietStorage.getLastSyncSeq(TEAM_ID))
        assertNotificationNotReposted(original)

        // A second log envelope carries the same authenticated message ID. This exercises the
        // persistent presentation dedupe as well as the cursor's already-seen entry filter.
        logSequence = 2
        receivePush()
        assertEquals(2L, QuietStorage.getLastSyncSeq(TEAM_ID))
        assertEquals("logs:1", requests.last())
        assertNotificationNotReposted(original)
    }

    @Test
    fun transientHttpFailurePreservesCursorAndNextWakePostsTheMessage() {
        failNextLogFetch = true

        receivePush()
        assertEquals(listOf("challenge", "token", "logs:0"), requests)
        assertEquals(0L, QuietStorage.getLastSyncSeq(TEAM_ID))
        assertNoMessageNotificationAfterCompletedCallback()

        receivePush()
        awaitMessageNotification()
        assertEquals(1L, QuietStorage.getLastSyncSeq(TEAM_ID))
        assertEquals(listOf("challenge", "token", "logs:0", "logs:0"), requests)
    }

    @Test
    fun missingSignatureKeyKeepsCursorUntilRealKeyArrives() {
        QuietStorage.clearAll()
        seedNativeStorage(includeUserKey = false)

        repeat(MAX_MISSING_NOTIFICATION_KEY_FAILURES) {
            receivePush()
            assertEquals(0L, QuietStorage.getLastSyncSeq(TEAM_ID))
            assertNoMessageNotificationAfterCompletedCallback()
        }
        assertEquals(MAX_MISSING_NOTIFICATION_KEY_FAILURES, requests.count { it == "logs:0" })

        QuietStorage.addLfaKey("quiet_${TEAM_ID}_USER_user-1_0_userSig", USER_PUBLIC_KEY_BASE58)
        receivePush()
        awaitMessageNotification()
        assertEquals(1L, QuietStorage.getLastSyncSeq(TEAM_ID))
    }

    @Test
    fun clearingNativePushStorageRejectsDelayedWakeAndAllowsReenrollment() {
        receivePush()
        val original = awaitMessageNotification()
        notificationManager.cancelAll()
        // Exercise the native cleanup primitive used by community teardown. This is not a UI
        // leave test or proof of server-side provider-token revocation.
        QuietStorage.clearAll()
        assertNull(QuietStorage.getDeviceId())
        assertNull(QuietStorage.getLocalUserId(TEAM_ID))
        assertNull(QuietStorage.getDevicePrivateKey(DEVICE_ID))
        assertNull(QuietStorage.getQssUrl(TEAM_ID))
        assertNull(QuietStorage.getQssServerId(TEAM_ID))
        assertNull(QuietStorage.getChannelName(TEAM_ID, "channel-1"))
        assertNull(QuietStorage.getNickname("user-1"))
        assertNull(QuietStorage.getLfaKey("quiet_${TEAM_ID}_TEAM_TEAM_0_secret"))
        assertFalse(QuietStorage.isTeamQssEnabled())
        assertEquals(0L, QuietStorage.getLastSyncSeq(TEAM_ID))

        val requestsBeforeDelayedWake = requests.toList()
        receivePush()
        assertEquals(requestsBeforeDelayedWake, requests)
        assertNoMessageNotificationAfterCompletedCallback()

        seedNativeStorage()
        receivePush()
        val reenrolled = awaitMessageNotification()
        assertTrue("Cleared presentation dedupe must allow this message again", reenrolled.postTime > original.postTime)
        assertEquals(1L, QuietStorage.getLastSyncSeq(TEAM_ID))
    }

    private fun receivePush(includeTeam: Boolean = true) {
        val service = QssFirebaseMessagingService()
        // Attach only the real target Context through Android's protected ContextWrapper API.
        // Invoke the unchanged production receive callback, including all of its early gates.
        // No service manifest hook, auth override, synthetic notification callback or Firebase
        // delivery claim is involved; Activity lifecycle is deliberately not started here.
        ContextWrapper::class.java.getDeclaredMethod("attachBaseContext", Context::class.java).apply {
            isAccessible = true
        }.invoke(service, context)
        val message = RemoteMessage.Builder("qss-native-regression")
        if (includeTeam) message.addData("teamId", TEAM_ID)
        try {
            service.onMessageReceived(message.build())
        } finally {
            service.onDestroy()
        }
        assertNull("fixed QSS rejected a native request", serverFailure)
    }

    private fun assertNoFetchOrMessage() {
        assertTrue("Receive gate must run before QSS HTTP", requests.isEmpty())
        assertEquals(0L, QuietStorage.getLastSyncSeq(TEAM_ID))
        assertNoMessageNotificationAfterCompletedCallback()
    }

    private fun assertNoMessageNotificationAfterCompletedCallback() {
        // receivePush is synchronous. Request/cursor assertions at each call site distinguish a
        // gated callback, a consumed suppressed message, and a retryable failure before this check.
        val deadline = SystemClock.uptimeMillis() + 500
        do {
            assertTrue("Unexpected OS message notification", messageNotifications().isEmpty())
            SystemClock.sleep(25)
        } while (SystemClock.uptimeMillis() < deadline)
    }

    private fun messageNotifications(): List<StatusBarNotification> =
        notificationManager.activeNotifications.filter {
            it.notification.channelId == Const.INCOMING_MESSAGES_CHANNEL_ID &&
                it.notification.flags and Notification.FLAG_GROUP_SUMMARY == 0
        }

    private fun awaitMessageNotification(): StatusBarNotification {
        val deadline = SystemClock.uptimeMillis() + 5_000
        while (SystemClock.uptimeMillis() < deadline) {
            val children = messageNotifications()
            if (children.isNotEmpty()) {
                assertEquals("One message child, excluding Android's group summary", 1, children.size)
                return children.single()
            }
            SystemClock.sleep(25)
        }
        throw AssertionError("Production NotificationHandler did not post an OS message notification")
    }

    private fun assertNotificationNotReposted(original: StatusBarNotification) {
        // The native callback and its HTTP attempt have completed. Watch the OS queue settle too;
        // count alone misses NotificationManager.notify replacing an existing per-channel ID.
        val deadline = SystemClock.uptimeMillis() + 500
        do {
            val current = messageNotifications().single()
            assertEquals(original.id, current.id)
            assertEquals("Duplicate message reposted the same notification ID", original.postTime, current.postTime)
            assertEquals(original.notification.extras.getCharSequence(Notification.EXTRA_TEXT).toString(), current.notification.extras.getCharSequence(Notification.EXTRA_TEXT).toString())
            SystemClock.sleep(25)
        } while (SystemClock.uptimeMillis() < deadline)
    }

    private fun fixedQssDispatcher() =
        object : Dispatcher() {
            override fun dispatch(request: RecordedRequest): MockResponse =
                try {
                    when (request.requestUrl?.encodedPath?.removePrefix(fixturePath)) {
                        "nse-auth/challenge" -> challenge(request)
                        "nse-auth/token" -> token(request)
                        "nse-auth/logs/$TEAM_ID" -> logs(request)
                        else -> throw AssertionError("unexpected fixed-QSS request ${request.method} ${request.path}")
                    }
                } catch (error: Throwable) {
                    serverFailure = error
                    MockResponse().setResponseCode(400).setBody(JSONObject().put("error", error.message).toString())
                }
        }

    private fun challenge(request: RecordedRequest): MockResponse {
        assertEquals("POST", request.method)
        val body = JSONObject(request.body.readUtf8())
        assertEquals(setOf("deviceId", "teamId"), body.keys().asSequence().toSet())
        assertEquals(DEVICE_ID, body.getString("deviceId"))
        assertEquals(TEAM_ID, body.getString("teamId"))
        requests += "challenge"
        return jsonResponse(
            JSONObject()
                .put("challengeId", CHALLENGE_ID)
                .put(
                    "challenge",
                    JSONObject()
                        .put("protocolVersion", 1)
                        .put("type", "DEVICE")
                        .put("deviceId", DEVICE_ID)
                        .put("teamId", TEAM_ID)
                        .put("qssServerId", QSS_SERVER_ID)
                        .put("challengeId", CHALLENGE_ID)
                        .put("nonce", NONCE_BASE58)
                        .put("issuedAtMs", challengeTimeMs)
                        .put("expiresAtMs", challengeTimeMs + 30_000),
                ),
        )
    }

    private fun token(request: RecordedRequest): MockResponse {
        assertEquals("POST", request.method)
        val body = JSONObject(request.body.readUtf8())
        assertEquals(setOf("challengeId", "deviceId", "signature"), body.keys().asSequence().toSet())
        assertEquals(CHALLENGE_ID, body.getString("challengeId"))
        assertEquals(DEVICE_ID, body.getString("deviceId"))
        val signature = CopperBase58.decode(body.getString("signature"))
        assertEquals(64, signature.size)
        assertTrue("native proof did not verify against the registered device key", verifyDeviceProof(signature))
        val tamperedProof = signature.copyOf()
        tamperedProof[0] = (tamperedProof[0].toInt() xor 1).toByte()
        assertFalse("fixture verifier must reject a modified proof", verifyDeviceProof(tamperedProof))
        requests += "token"
        return jsonResponse(JSONObject().put("token", TOKEN).put("expiresIn", 120))
    }

    private fun logs(request: RecordedRequest): MockResponse {
        assertEquals("GET", request.method)
        assertEquals("Bearer $TOKEN", request.getHeader("Authorization"))
        val afterSeq = requireNotNull(request.requestUrl?.queryParameter("afterSeq")).toLong()
        requests += "logs:$afterSeq"
        if (failNextLogFetch) {
            failNextLogFetch = false
            return MockResponse().setResponseCode(503).setBody("Temporary fixture outage")
        }
        val entryBytes = Base64.decode(ENCRYPTED_LOG_ENTRY_BASE64, Base64.DEFAULT)
        val byteValues = JSONArray()
        entryBytes.forEach { byteValues.put(it.toInt() and 0xff) }
        return jsonResponse(
            JSONObject()
                .put(
                    "entries",
                    JSONArray().apply {
                        if (logSequence > afterSeq) put(
                            JSONObject()
                                .put("cid", "cid-$logSequence")
                                .put("hashedDbId", "db-1")
                                .put("communityId", TEAM_ID)
                                .put("entry", JSONObject().put("type", "Buffer").put("data", byteValues))
                                .put("receivedAt", "2023-11-14T22:13:20.000Z")
                                .put("syncSeq", logSequence),
                        )
                    },
                )
                .put("resolvedAfterSeq", logSequence),
        )
    }

    private fun verifyDeviceProof(signature: ByteArray): Boolean {
        val challenge =
            ChallengePayload(
                protocolVersion = 1,
                type = "DEVICE",
                deviceId = DEVICE_ID,
                teamId = TEAM_ID,
                qssServerId = QSS_SERVER_ID,
                challengeId = CHALLENGE_ID,
                nonce = NONCE_BASE58,
                issuedAtMs = challengeTimeMs,
                expiresAtMs = challengeTimeMs + 30_000,
            )
        val publicKey = CopperBase58.decode(DEVICE_PUBLIC_KEY_BASE58)
        val canonicalProof = MsgpackEncoder.encodeNseAuthProof(challenge)
        // Android's Ed25519 KeyFactory may select AndroidKeyStore, which cannot import this
        // fixture public key. Use the already-linked native verifier, never accept a dummy proof.
        return LazySodiumAndroid(SodiumAndroid()).cryptoSignVerifyDetached(
            signature,
            canonicalProof,
            canonicalProof.size,
            publicKey,
        )
    }

    private fun jsonResponse(body: JSONObject) =
        MockResponse()
            .setResponseCode(200)
            .setHeader("Content-Type", "application/json")
            .setBody(body.toString())

    companion object {
        private const val DEVICE_ID = "device-1"
        private const val TEAM_ID = "team-1"
        private const val QSS_SERVER_ID = "pinned-qss-1"
        private const val CHALLENGE_ID = "00112233445566778899aabbccddeeff"
        private const val NONCE_BASE58 = "11111111111111111111111111111111"
        private const val TOKEN = "short-lived-fixed-token"
        private const val DEVICE_SEED_BASE58 = "1thX6LZfHDZZKUs92febYZhYRcXddmzfzF2NvTkPNE"
        private const val DEVICE_PUBLIC_KEY_BASE58 = "FAe4sisG95oZ42w7buUn5qEE4TAnfTTFPiguZUHmhiF"
        private const val USER_PUBLIC_KEY_BASE58 = "3ogUn1GNXoASaRbxPNeVJnVv5rG4EPBtmQmX61jVorUe"
        private const val OUTER_TEAM_SECRET = "outer-team-secret-material"
        private const val INNER_ROLE_SECRET = "inner-role-secret-material"
        // Reproduced by generateNotificationFixture.cjs with the pinned auth codecs. Contains a
        // TEAM-encrypted OrbitDB envelope and a ROLE-encrypted, TEAM_MESSAGE-signed channel message,
        // including the current inner/outer id, teamId and createdAt binding fields.
        private const val ENCRYPTED_LOG_ENTRY_BASE64 =
            "3gABqWVuY3J5cHRlZN4AAqhjb250ZW50c8UChN4ABKVub25jZcQYGBkaGxwdHh8gISIjJCUmJygpKissLS4vo3RhZ8Qgz0oCDk5N3wmMhP+FkT1yy/+o/Tu2jrIcGan2JgjoIbinbWVzc2FnZcUCGkgbXC1Zye/gtNL02VNQtm45mPFdnmNI6sZ1b7p+pN6teAxvxM6TkzKyd1xAaEb30LGJ3FXUp/zP/INV7BX4Cr5E3GyOWmkTByEuJaqxfbuuJtHF/Oa1oVkfTGszHrvKoTV5YS3/xvQIbR/IPZyOVlP11zf/tEqQdVEW0zZQuWuZOoj5IUHGSZ1B4brr52lhzXB8oJszPW2lY283GnxBZqqZ1XYeldOTkm+gamWqwyb0FZykXWzto3UgZund+w15+pRygEVjnkoT5ClR0TlhorH5YIEAlqEcMTqMglJGBf5gexpj1dxl4UqWZ6iUnoSlzLkH9dJTRWjf/yz0wZLEunIYbwEZCQV1oG3VJu6eOh1ba6WDfrWPzfm1sH7CADnvXstVowBoayHuWuUOuzDJAcgda8R8SMsLogjSEygh8heS4NgGCBgnfa3uhWCDpQjALfduZRDQRShHHuUHkhfKQTEWxiZzV7mG9m8j9oScbZLPSQfbXSUGtGC4wr48oiy1xNOGfxydEkHBUqSCWkKlvArtcoRc3IdDJLJG2E0XiDS2dn8xm0JlbJcfD8fh6OXQpsNQIXlmZIcceYvlqnehhcAjyvGAdgpPAVq89bsV7g8YY7Tycq0mCIq9zGXC5OGKOJ0ayeOYQnSlr0XtStgb4vre4d9BMW76lKb750CjP+by7U4WLz7fBzJ7YnosaDJLMfJ013blA7fg0emjbWFjxBBb34mVyplXQlLhHNsK+XixpXNjb3Bl3gADpHR5cGWkVEVBTaRuYW1lpFRFQU2qZ2VuZXJhdGlvbgA="
    }
}
