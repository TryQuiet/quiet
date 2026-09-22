package com.quietmobile.Push

import org.junit.Assert.assertArrayEquals
import org.junit.Test

class MsgpackEncoderTest {
    @Test
    fun wrapsExactPlaintextInLfaTeamMessageDomain() {
        // msgpackr.pack({ foo: "bar" }). Keeping the already-decrypted bytes is
        // important: re-encoding a map can change field/record ordering.
        val plaintext = hex("de0001a3666f6fa3626172")
        val expected =
            hex(
                "92" +
                    "b46c662f617574682f7465616d2d6d657373616765" +
                    "de0001a3666f6fa3626172",
            )

        assertArrayEquals(
            expected,
            MsgpackEncoder.withSignatureContext("lf/auth/team-message", plaintext),
        )
    }

    private fun hex(value: String): ByteArray =
        value.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
}
