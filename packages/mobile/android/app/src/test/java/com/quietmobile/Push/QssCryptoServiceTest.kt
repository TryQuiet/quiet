package com.quietmobile.Push

import com.apicatalog.base.Base58 as CopperBase58
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test
import java.security.KeyPairGenerator
import java.security.Signature

class QssCryptoServiceTest {
    private val keyPair = KeyPairGenerator.getInstance("Ed25519").generateKeyPair()
    private val publicKey = keyPair.public.encoded.takeLast(32).toByteArray()
    private val teamId = "team-id"
    private val plaintext = byteArrayOf(0x81.toByte(), 0xa2.toByte(), 0x69, 0x64, 0xa1.toByte(), 0x31)

    private val keyLookup: (String) -> String? = { CopperBase58.encode(publicKey) }
    private val verifier: (ByteArray, ByteArray, ByteArray) -> Boolean = { signature, payload, rawPublicKey ->
        check(rawPublicKey.contentEquals(publicKey))
        Signature.getInstance("Ed25519").run {
            initVerify(keyPair.public)
            update(payload)
            verify(signature)
        }
    }

    private fun signature(
        authorName: String = "alice-id",
        signedPlaintext: ByteArray = plaintext,
    ): MessageSignature {
        val payload = MsgpackEncoder.withSignatureContext("lf/auth/team-message", signedPlaintext)
        val signature =
            Signature.getInstance("Ed25519").run {
                initSign(keyPair.private)
                update(payload)
                sign()
            }
        return MessageSignature(
            signature = CopperBase58.encode(signature),
            author = SignatureAuthor(type = "USER", name = authorName, generation = 3),
        )
    }

    private fun message(): Map<String, Any> =
        mapOf(
            "id" to "message-id",
            "channelId" to "channel-id",
            "userId" to "alice-id",
            "teamId" to teamId,
            "createdAt" to 1234L,
            "type" to 1,
            "message" to "authenticated body",
        )

    private fun envelope(): Map<String, Any> =
        mapOf(
            "id" to "message-id",
            "channelId" to "channel-id",
            "teamId" to teamId,
            "createdAt" to 1234L,
        )

    @Test
    fun acceptsValidAuthenticatedMessage() {
        val result = authenticate(envelope(), message(), plaintext, signature())

        assertEquals("message-id", result?.id)
        assertEquals("alice-id", result?.userId)
        assertEquals("authenticated body", result?.body)
    }

    @Test
    fun rejectsMissingOrMalformedSignature() {
        assertThrows(IllegalStateException::class.java) { parseMessageSignature(null) }
        assertThrows(IllegalStateException::class.java) {
            parseMessageSignature(mapOf("signature" to "not-enough-fields"))
        }
    }

    @Test
    fun rejectsInvalidSignatureAndContentChangedAfterSigning() {
        val invalid = signature().copy(signature = CopperBase58.encode(ByteArray(64)))
        assertThrows(IllegalStateException::class.java) {
            authenticate(envelope(), message(), plaintext, invalid)
        }

        assertThrows(IllegalStateException::class.java) {
            authenticate(
                envelope(),
                message(),
                plaintext + byteArrayOf(0),
                signature(),
            )
        }
    }

    @Test
    fun rejectsSignerAndImmutableFieldSubstitution() {
        assertThrows(IllegalStateException::class.java) {
            authenticate(envelope(), message(), plaintext, signature("mallory-id"))
        }

        assertThrows(IllegalStateException::class.java) {
            authenticate(
                envelope() + ("channelId" to "other-channel"),
                message(),
                plaintext,
                signature(),
            )
        }
    }

    @Test
    fun rejectsMalformedSignatureBeforeMissingKeyLookup() {
        var lookedUp = false
        val malformed = signature().copy(
            signature = "not-base58!",
            author = SignatureAuthor(type = "USER", name = "alice-id", generation = 999),
        )

        assertThrows(IllegalStateException::class.java) {
            authenticateNotificationMessage(
                envelope(),
                message(),
                plaintext,
                malformed,
                teamId,
                {
                    lookedUp = true
                    null
                },
                verifier,
            )
        }
        assertEquals(false, lookedUp)
    }

    @Test
    fun malformedGenerationIsConsumedBeforeLookupAndDoesNotBlockNextValidEntry() {
        val entries = listOf(1L, 2L).map { sequence ->
            LogEntry("cid-$sequence", "db", teamId, byteArrayOf(), "2026-09-01T00:00:00Z", sequence)
        }
        val lookups = mutableListOf<String>()
        val presented = mutableListOf<Long>()

        val cursor = processContiguousQssEntries(
            afterSeq = 0,
            entries = entries,
            authenticate = { entry ->
                val signed = signature()
                val parsed = parseMessageSignature(
                    mapOf(
                        "signature" to signed.signature,
                        "author" to mapOf(
                            "type" to signed.author.type,
                            "name" to signed.author.name,
                            "generation" to if (entry.syncSeq == 1L) 3.5 else 3,
                        ),
                    ),
                )
                authenticateNotificationMessage(
                    envelope(),
                    message(),
                    plaintext,
                    parsed,
                    teamId,
                    { keyName -> lookups += keyName; CopperBase58.encode(publicKey) },
                    verifier,
                )
            },
            present = { entry, _ -> presented += entry.syncSeq },
            isPermanentRejection = { it !is MissingQssNotificationKeyException },
        )

        assertEquals(2L, cursor)
        assertEquals(listOf(2L), presented)
        assertEquals(listOf("quiet_team-id_USER_alice-id_3_userSig"), lookups)
    }

    private fun authenticate(
        envelope: Map<*, *>,
        message: Map<*, *>,
        plaintext: ByteArray,
        signature: MessageSignature,
    ): DecryptedNotificationMessage? =
        authenticateNotificationMessage(
            envelope,
            message,
            plaintext,
            signature,
            teamId,
            keyLookup,
            verifier,
        )
}
