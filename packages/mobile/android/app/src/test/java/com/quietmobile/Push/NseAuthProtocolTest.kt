package com.quietmobile.Push

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertThrows
import org.junit.Test

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

    private fun hex(value: String): ByteArray = value.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
}
