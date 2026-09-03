package com.quietmobile.Push

import android.util.Log
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.mockito.MockedStatic
import org.mockito.Mockito

class QssPushHandlerTest {
    private lateinit var logMock: MockedStatic<Log>

    @Before
    fun mockAndroidLogging() {
        logMock = Mockito.mockStatic(Log::class.java)
    }

    @After
    fun closeAndroidLoggingMock() {
        logMock.close()
    }

    @Test
    fun `background handler drives challenge proof token log fetch decrypt and notification`() {
        val now = 1_700_000_000_000L
        val challenge =
            ChallengePayload(
                protocolVersion = 1,
                type = "DEVICE",
                deviceId = "device-1",
                teamId = "team-1",
                qssServerId = "pinned-qss-1",
                challengeId = "00112233445566778899aabbccddeeff",
                nonce = "11111111111111111111111111111111",
                issuedAtMs = now,
                expiresAtMs = now + 30_000,
            )
        val logEntry = LogEntry("cid-1", "db-1", "team-1", byteArrayOf(1), "now", 1)
        val calls = mutableListOf<String>()
        val client = object : QssAuthClient {
            override fun requestChallenge(deviceId: String, teamId: String): ChallengeResponse {
                calls += "challenge:$deviceId:$teamId"
                return ChallengeResponse(challenge.challengeId, challenge)
            }

            override fun requestToken(challengeId: String, deviceId: String, proof: ProofPayload): TokenResponse {
                calls += "token:$challengeId:$deviceId:${proof.signature}"
                return TokenResponse("short-lived-token", 120)
            }

            override fun fetchLogEntries(teamId: String, afterSeq: Long, token: String): LogEntriesResponse {
                calls += "logs:$teamId:$afterSeq:$token"
                return LogEntriesResponse(listOf(logEntry), 1)
            }
        }
        val crypto = object : QssMessageCrypto {
            override fun signNseAuthProof(challenge: ChallengePayload, privateKeyBytes: ByteArray): ProofPayload {
                calls += "sign:${challenge.challengeId}:${privateKeyBytes.size}"
                return ProofPayload("device-proof")
            }

            override fun decryptNotificationMessage(
                logEntry: LogEntry,
                teamId: String,
            ): DecryptedNotificationMessage {
                calls += "decrypt:${logEntry.cid}:$teamId"
                return DecryptedNotificationMessage("message-1", "channel-1", "user-1", "hello", 1)
            }
        }
        val auth =
            QssAuthService(
                client = client,
                crypto = crypto,
                keyProvider = DevicePrivateKeyProvider { calls += "key:$it"; ByteArray(32) },
                deviceIdProvider = { "device-1" },
                nowMs = { now },
            )
        val notifications = mutableListOf<Pair<JSONObject, String>>()
        var savedCursor: Pair<Long, String>? = null

        QssPushHandler(
            authService = auth,
            cryptoService = crypto,
            getLastSyncSeq = { 0 },
            saveLastSyncSeq = { seq, team -> savedCursor = seq to team },
            recordMissingNotificationKeyFailure = { _, _ -> 1 },
            clearMissingNotificationKeyFailure = { _, _ -> },
            isAppForeground = { false },
            getChannelName = { _, _ -> "general" },
            getNickname = { "Alice" },
            notify = { payload, nickname -> notifications += JSONObject(payload) to nickname },
        ).handle("team-1", "pinned-qss-1")

        assertEquals(
            listOf(
                "challenge:device-1:team-1",
                "key:device-1",
                "sign:${challenge.challengeId}:32",
                "token:${challenge.challengeId}:device-1:device-proof",
                "logs:team-1:0:short-lived-token",
                "decrypt:cid-1:team-1",
            ),
            calls,
        )
        assertEquals(1L to "team-1", savedCursor)
        assertEquals(1, notifications.size)
        assertEquals("message-1", notifications.single().first.getString("id"))
        assertEquals("channel-1", notifications.single().first.getString("channelId"))
        assertEquals("hello", notifications.single().first.getString("message"))
        assertEquals("general", notifications.single().first.getString("channelName"))
        assertEquals("Alice", notifications.single().second)
    }
}
