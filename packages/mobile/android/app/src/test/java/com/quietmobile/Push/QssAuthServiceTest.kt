package com.quietmobile.Push

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class QssAuthServiceTest {
    private val now = 1_700_000_000_000L
    private val valid =
        ChallengePayload(
            protocolVersion = 1,
            type = "DEVICE",
            deviceId = "device-test-1",
            teamId = "team-test-1",
            qssServerId = "qss-test-1",
            challengeId = "00112233445566778899aabbccddeeff",
            nonce = "11111111111111111111111111111111",
            issuedAtMs = now,
            expiresAtMs = now + 30_000,
        )

    @Test
    fun `authenticate refuses every malicious challenge before device key access signing or token exchange`() {
        val invalidResponses =
            listOf(
                "outer challenge id" to ChallengeResponse("ffeeddccbbaa99887766554433221100", valid),
                "protocol version" to response(valid.copy(protocolVersion = 2)),
                "proof type" to response(valid.copy(type = "USER")),
                "device id" to response(valid.copy(deviceId = "attacker-device")),
                "team id" to response(valid.copy(teamId = "attacker-team")),
                "pinned QSS server id" to response(valid.copy(qssServerId = "attacker-qss")),
                "challenge id shape" to response(valid.copy(challengeId = "A".repeat(32))),
                "nonce encoding" to response(valid.copy(nonce = "1".repeat(31))),
                "issued-at future window" to response(
                    valid.copy(issuedAtMs = now + NseAuthProtocol.CLOCK_SKEW_MS + 1),
                ),
                "expired window" to response(
                    valid.copy(
                        issuedAtMs = now - 40_000,
                        expiresAtMs = now - NseAuthProtocol.CLOCK_SKEW_MS - 1,
                    ),
                ),
                "non-positive window" to response(valid.copy(expiresAtMs = valid.issuedAtMs)),
                "oversized window" to response(
                    valid.copy(expiresAtMs = valid.issuedAtMs + NseAuthProtocol.MAXIMUM_LIFETIME_MS + 1),
                ),
                "unsafe issued-at" to response(valid.copy(issuedAtMs = NseAuthProtocol.MAXIMUM_SAFE_INTEGER + 1)),
                "unsafe expiry" to response(valid.copy(expiresAtMs = NseAuthProtocol.MAXIMUM_SAFE_INTEGER + 1)),
            )

        invalidResponses.forEach { (label, challengeResponse) ->
            val client = RecordingClient(challengeResponse)
            var keyAccesses = 0
            var signatures = 0
            val service =
                QssAuthService(
                    client = client,
                    crypto = NseProofSigner { _, _ -> signatures += 1; ProofPayload("must-not-sign") },
                    keyProvider = DevicePrivateKeyProvider { keyAccesses += 1; ByteArray(32) },
                    nowMs = { now },
                )

            assertThrows("accepted malicious $label", IllegalArgumentException::class.java) {
                service.authenticate(valid.deviceId, valid.teamId, valid.qssServerId)
            }
            assertEquals("key accessed for malicious $label", 0, keyAccesses)
            assertEquals("signed malicious $label", 0, signatures)
            assertEquals("requested token for malicious $label", 0, client.tokenRequests)
        }
    }

    @Test
    fun `authenticate signs the exact validated challenge and sends only proof-bound identifiers`() {
        val client = RecordingClient(response(valid))
        var signedChallenge: ChallengePayload? = null
        var signedKey: ByteArray? = null
        val expectedKey = ByteArray(32) { it.toByte() }
        val service =
            QssAuthService(
                client = client,
                crypto = NseProofSigner { challenge, key ->
                    signedChallenge = challenge
                    signedKey = key
                    ProofPayload("registered-device-signature")
                },
                keyProvider = DevicePrivateKeyProvider { expectedKey },
                nowMs = { now },
            )

        assertEquals("valid-token", service.authenticate(valid.deviceId, valid.teamId, valid.qssServerId))
        assertEquals(valid, signedChallenge)
        assertEquals(expectedKey.toList(), signedKey?.toList())
        assertEquals(valid.challengeId, client.lastTokenChallengeId)
        assertEquals(valid.deviceId, client.lastTokenDeviceId)
        assertEquals(ProofPayload("registered-device-signature"), client.lastProof)
        assertEquals(1, client.tokenRequests)
    }

    private fun response(payload: ChallengePayload) = ChallengeResponse(payload.challengeId, payload)

    private class RecordingClient(
        private val challengeResponse: ChallengeResponse,
    ) : QssAuthClient {
        var tokenRequests = 0
        var lastTokenChallengeId: String? = null
        var lastTokenDeviceId: String? = null
        var lastProof: ProofPayload? = null

        override fun requestChallenge(deviceId: String, teamId: String) = challengeResponse

        override fun requestToken(challengeId: String, deviceId: String, proof: ProofPayload): TokenResponse {
            tokenRequests += 1
            lastTokenChallengeId = challengeId
            lastTokenDeviceId = deviceId
            lastProof = proof
            return TokenResponse("valid-token", 120)
        }

        override fun fetchLogEntries(teamId: String, afterSeq: Long, token: String) =
            LogEntriesResponse(emptyList(), afterSeq)
    }
}
