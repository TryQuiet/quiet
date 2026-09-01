package com.quietmobile.Push

import com.apicatalog.base.Base58 as CopperBase58
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test
import org.json.JSONObject
import java.security.KeyFactory
import java.security.Signature
import java.security.spec.PKCS8EncodedKeySpec

class NseAuthProtocolTest {
    private val challenge = ChallengePayload(
        protocolVersion = 1,
        type = "DEVICE",
        deviceId = "device-test-1",
        teamId = "team-test-1",
        qssServerId = "qss-test-1",
        challengeId = "00112233445566778899aabbccddeeff",
        nonce = "11111111111111111111111111111111",
        issuedAtMs = 1_700_000_000_000,
        expiresAtMs = 1_700_000_030_000,
    )

    @Test
    fun `canonical bytes match TypeScript msgpackr golden vector`() {
        val expected = hex(
            "92bf71756965742f7173732d6e73652d617574682f6465766963652d70726f6f66" +
                "9901a6444556494345ad6465766963652d746573742d31ab7465616d2d746573742d31" +
                "aa7173732d746573742d31d920303031313232333334343535363637373838393961616262" +
                "6363646465656666d920313131313131313131313131313131313131313131313131313131" +
                "3131313131cb4278bcfe56800000cb4278bcfe5dd30000",
        )
        assertArrayEquals(expected, MsgpackEncoder.encodeNseAuthProof(challenge))
    }

    @Test
    fun `native signer matches the cross-platform fixed signature fixture`() {
        val secretKey = CopperBase58.decode(
            "2ZC6948FLMTyZ9cAN2Db6u4E9FN72vEwXa1s193vMozZUYnBzVU7952gS6zY7T2VZJVBuJKSsdo7gDDkox3tZx4u",
        )
        val pkcs8Prefix = hex("302e020100300506032b657004220420")
        val privateKey = KeyFactory.getInstance("Ed25519").generatePrivate(
            PKCS8EncodedKeySpec(pkcs8Prefix + secretKey.copyOfRange(0, 32)),
        )
        val signature = Signature.getInstance("Ed25519").run {
            initSign(privateKey)
            update(MsgpackEncoder.encodeNseAuthProof(challenge))
            sign()
        }
        assertEquals(
            "62XsfcCvq4SeRxmVK6LNyjuPpLyUSaCxPD315LRtfet9GnHQ6zu5sg8muz1eh4ZvvnZ6m3SH88KRztu4gm8W5YQk",
            CopperBase58.encode(signature),
        )
    }

    @Test
    fun `validation binds every local identity and validity field`() {
        challenge.validate("device-test-1", "team-test-1", "qss-test-1", 1_700_000_000_000)
        assertThrows(IllegalArgumentException::class.java) {
            challenge.copy(deviceId = "attacker-device").validate(
                "device-test-1", "team-test-1", "qss-test-1", 1_700_000_000_000,
            )
        }
        assertThrows(IllegalArgumentException::class.java) {
            challenge.copy(qssServerId = "qss-test-2").validate(
                "device-test-1", "team-test-1", "qss-test-1", 1_700_000_000_000,
            )
        }
        assertThrows(IllegalArgumentException::class.java) {
            challenge.copy(expiresAtMs = 1_700_000_030_001).validate(
                "device-test-1", "team-test-1", "qss-test-1", 1_700_000_000_000,
            )
        }
    }

    @Test
    fun `validation rejects protocol nonce and timestamp edge cases`() {
        val now = 1_700_000_000_000L
        val invalid = listOf(
            challenge.copy(protocolVersion = 2),
            challenge.copy(type = "USER"),
            challenge.copy(nonce = "0"),
            challenge.copy(nonce = "1".repeat(31)),
            challenge.copy(issuedAtMs = now + NseAuthProtocol.CLOCK_SKEW_MS + 1),
            challenge.copy(expiresAtMs = now - NseAuthProtocol.CLOCK_SKEW_MS - 1),
            challenge.copy(issuedAtMs = NseAuthProtocol.MAXIMUM_SAFE_INTEGER + 1),
            challenge.copy(expiresAtMs = NseAuthProtocol.MAXIMUM_SAFE_INTEGER + 1),
            challenge.copy(issuedAtMs = -1),
        )
        invalid.forEach { candidate ->
            assertThrows(IllegalArgumentException::class.java) {
                candidate.validate("device-test-1", "team-test-1", "qss-test-1", now)
            }
        }
    }

    @Test
    fun `JSON parser requires exact schema strings and safe numeric integers`() {
        val client = QssNetworkClient("https://qss.example")
        val valid = JSONObject()
            .put("challengeId", challenge.challengeId)
            .put("challenge", JSONObject()
                .put("protocolVersion", challenge.protocolVersion)
                .put("type", challenge.type)
                .put("deviceId", challenge.deviceId)
                .put("teamId", challenge.teamId)
                .put("qssServerId", challenge.qssServerId)
                .put("challengeId", challenge.challengeId)
                .put("nonce", challenge.nonce)
                .put("issuedAtMs", challenge.issuedAtMs)
                .put("expiresAtMs", challenge.expiresAtMs))
        client.parseChallengeResponse(valid)

        listOf(
            JSONObject(valid.toString()).apply { getJSONObject("challenge").put("extra", true) },
            JSONObject(valid.toString()).apply { getJSONObject("challenge").put("issuedAtMs", "1700000000000") },
            JSONObject(valid.toString()).apply { getJSONObject("challenge").put("expiresAtMs", 9_007_199_254_740_992L) },
            JSONObject(valid.toString()).apply { getJSONObject("challenge").put("issuedAtMs", 1.5) },
            JSONObject(valid.toString()).apply { getJSONObject("challenge").put("type", 7) },
        ).forEach { json ->
            assertThrows(IllegalArgumentException::class.java) {
                client.parseChallengeResponse(json)
            }
        }

        listOf("1700000000000.0001", "9007199254740990.6").forEach { timestamp ->
            val literal = JSONObject(
                """{"challengeId":"00112233445566778899aabbccddeeff","challenge":{"protocolVersion":1,"type":"DEVICE","deviceId":"device-test-1","teamId":"team-test-1","qssServerId":"qss-test-1","challengeId":"00112233445566778899aabbccddeeff","nonce":"11111111111111111111111111111111","issuedAtMs":$timestamp,"expiresAtMs":1700000030000}}""",
            )
            assertThrows(IllegalArgumentException::class.java) {
                client.parseChallengeResponse(literal)
            }
        }
    }

    private fun hex(value: String): ByteArray = value.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
}
