package com.quietmobile.Push

import android.content.Context
import android.util.Base64
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.apicatalog.base.Base58 as CopperBase58
import okhttp3.mockwebserver.Dispatcher
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.RecordedRequest
import org.json.JSONArray
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.security.KeyFactory
import java.security.Signature
import java.security.spec.X509EncodedKeySpec

@RunWith(AndroidJUnit4::class)
class QssPushHandlerTest {
    private val server = MockWebServer()
    private val requests = mutableListOf<String>()
    private var serverFailure: Throwable? = null

    @Before
    fun setUp() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        QuietStorage.init(context)
        QuietStorage.clearAll()
        QuietStorage.saveDeviceCredentials(DEVICE_ID, TEAM_ID, DEVICE_SEED_BASE58)
        QuietStorage.addLfaKey("quiet_${TEAM_ID}_TEAM_TEAM_0_secret", OUTER_TEAM_SECRET)
        QuietStorage.addLfaKey("quiet_${TEAM_ID}_ROLE_MEMBER_0_secret", INNER_ROLE_SECRET)
        QuietStorage.addLfaKey("quiet_${TEAM_ID}_USER_user-1_0_userSig", USER_PUBLIC_KEY_BASE58)
        QuietStorage.addChannelMetadata(TEAM_ID, "channel-1", "general")
        QuietStorage.saveUserMetadata("user-1", "Alice")
        QuietStorage.setAppForeground(false)
        server.dispatcher = fixedQssDispatcher()
        server.start()
    }

    @After
    fun tearDown() {
        server.shutdown()
        QuietStorage.clearAll()
    }

    @Test
    fun fixedQssAuthenticatesDecryptsAndRendersBackgroundNotification() {
        val crypto = QssCryptoService()
        val auth =
            QssAuthService(
                client = QssNetworkClient(server.url("/").toString()),
                crypto = crypto,
                nowMs = { NOW_MS },
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
            notify = { payload, nickname -> notifications += JSONObject(payload) to nickname },
        ).handle(TEAM_ID, QSS_SERVER_ID)

        assertNull("fixed QSS rejected the native request", serverFailure)
        assertEquals(listOf("challenge", "token", "logs"), requests)
        assertEquals(1L, QuietStorage.getLastSyncSeq(TEAM_ID))
        assertEquals(1, notifications.size)
        val (payload, nickname) = notifications.single()
        assertEquals("message-1", payload.getString("id"))
        assertEquals("channel-1", payload.getString("channelId"))
        assertEquals("hello from fixed QSS", payload.getString("message"))
        assertEquals("general", payload.getString("channelName"))
        assertEquals("Alice", nickname)
    }

    private fun fixedQssDispatcher() =
        object : Dispatcher() {
            override fun dispatch(request: RecordedRequest): MockResponse =
                try {
                    when (request.path) {
                        "/nse-auth/challenge" -> challenge(request)
                        "/nse-auth/token" -> token(request)
                        "/nse-auth/logs/$TEAM_ID?afterSeq=0" -> logs(request)
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
                        .put("issuedAtMs", NOW_MS)
                        .put("expiresAtMs", NOW_MS + 30_000),
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
        requests += "token"
        return jsonResponse(JSONObject().put("token", TOKEN).put("expiresIn", 120))
    }

    private fun logs(request: RecordedRequest): MockResponse {
        assertEquals("GET", request.method)
        assertEquals("Bearer $TOKEN", request.getHeader("Authorization"))
        requests += "logs"
        val entryBytes = Base64.decode(ENCRYPTED_LOG_ENTRY_BASE64, Base64.DEFAULT)
        val byteValues = JSONArray()
        entryBytes.forEach { byteValues.put(it.toInt() and 0xff) }
        return jsonResponse(
            JSONObject()
                .put(
                    "entries",
                    JSONArray()
                        .put(
                            JSONObject()
                                .put("cid", "cid-1")
                                .put("hashedDbId", "db-1")
                                .put("communityId", TEAM_ID)
                                .put("entry", JSONObject().put("type", "Buffer").put("data", byteValues))
                                .put("receivedAt", "2023-11-14T22:13:20.000Z")
                                .put("syncSeq", 1),
                        ),
                )
                .put("resolvedAfterSeq", 1),
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
                issuedAtMs = NOW_MS,
                expiresAtMs = NOW_MS + 30_000,
            )
        val publicKey = CopperBase58.decode(DEVICE_PUBLIC_KEY_BASE58)
        val x509Prefix = hex("302a300506032b6570032100")
        val key = KeyFactory.getInstance("Ed25519").generatePublic(X509EncodedKeySpec(x509Prefix + publicKey))
        return Signature.getInstance("Ed25519").run {
            initVerify(key)
            update(MsgpackEncoder.encodeNseAuthProof(challenge))
            verify(signature)
        }
    }

    private fun jsonResponse(body: JSONObject) =
        MockResponse()
            .setResponseCode(200)
            .setHeader("Content-Type", "application/json")
            .setBody(body.toString())

    private fun hex(value: String): ByteArray = value.chunked(2).map { it.toInt(16).toByte() }.toByteArray()

    companion object {
        private const val NOW_MS = 1_700_000_000_000L
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
        // Generated once with msgpackr 1.11.2 and libsodium-wrappers-sumo 0.7.13. It contains a
        // TEAM-encrypted OrbitDB envelope and a ROLE-encrypted, TEAM_MESSAGE-signed channel message.
        private const val ENCRYPTED_LOG_ENTRY_BASE64 =
            "3gABqWVuY3J5cHRlZN4AAqhjb250ZW50c8UCNN4ABKVub25jZcQYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wo3RhZ8QgjYkp02Nks+SPSX8JRqcg7twPzwB1W/NShNXwj4JjHIinbWVzc2FnZcUByrb4nSBlceUbknzsaGsBZ9uTEpLgMz2tex/srQWCEL188TQlSd+EQirYJyCxrHbaVAhft/zgoW6MlsO93TdIFf4UH1pcCJzi6oEFGqTnochZI1IHFk8rdEcIaDB7MWHsyUGUIN1F9D7O6dKKGq6xDe96HdNFOibdVEUginQIcWWyie4E2DMjLcmPni0DNkULpHv12tslnSABLoDvo7pUEH0YffDR8a7kIyKSpjn061sjY1Eem8rfDaSZkNJ5tr2Y7mVKypOs9jOpxsnKcQoAYSO6Q/idOXXMWpd5phfwkG61alOr9plnuSoEYrwJZc6Pepe4AFIszDJPRhoOU46CXiS+tMFUN7b9vOdIzgSvGUL3Eir8iLNayQih2EybFV5X2jWaFUXjS8Xh83xkSRd1Ma4xvdeJlerjXsMvjVS9H74PvsGfrEhy0kXtLA4LdlOizJCTcxFSkaaXnKL16vbC7VNzYi/K3gPAardehzdl726ql52q7EtYE8VdIOtDIuYwzfCu7Vtj6YUjIbSiK++arbkBgoUg61a1eqiE767AIp+oJCCQsHRM5gHZ41OTYFxJ/hhpwxxS5TMHssahYpz9NB7Ga+rcGcbqGH9Ro21hY8QQqczMbq54S5e/L/0WJc4FtqVzY29wZd4AA6R0eXBlpFRFQU2kbmFtZaRURUFNqmdlbmVyYXRpb24A"
    }
}
