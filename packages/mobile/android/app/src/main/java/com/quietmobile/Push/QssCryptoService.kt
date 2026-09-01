package com.quietmobile.Push

import com.apicatalog.base.Base58 as CopperBase58
import com.goterl.lazysodium.LazySodiumAndroid
import com.goterl.lazysodium.SodiumAndroid
import com.goterl.lazysodium.interfaces.PwHash

internal fun parseQssEncryptedPayload(value: Any?, label: String): EncryptedPayload {
    val dict = value as? Map<*, *> ?: throw IllegalStateException("$label was not an object")
    val contents =
        when (val rawContents = dict["contents"]) {
            is ByteArray -> rawContents
            is List<*> -> {
                val bytes = ByteArray(rawContents.size)
                rawContents.forEachIndexed { index, item ->
                    val number = item as? Number ?: throw IllegalStateException("$label contents were not binary")
                    bytes[index] = number.toByte()
                }
                bytes
            }
            else -> throw IllegalStateException("$label contents were not binary")
        }
    val scope = dict["scope"] as? Map<*, *>
        ?: throw IllegalStateException("$label scope was malformed")
    return EncryptedPayload(
        contents = contents,
        scope =
            EncryptionScope(
                type = scope["type"] as? String
                    ?: throw IllegalStateException("$label scope.type missing"),
                name = scope["name"] as? String
                    ?: throw IllegalStateException("$label scope.name missing"),
                generation = exactNonNegativeInt(scope["generation"])
                    ?: throw IllegalStateException("$label scope.generation was not an exact non-negative integer"),
            ),
    )
}

class QssCryptoService(
    private val lfaKeyLookup: (String) -> String? = { keyName -> QuietStorage.getLfaKey(keyName) },
    private val signatureVerifier: ((ByteArray, ByteArray, ByteArray) -> Boolean)? = null,
) {
    private val sodium by lazy { LazySodiumAndroid(SodiumAndroid()) }

    private val stretchSalt: ByteArray =
        decodeBase58("H5B4DLSXw5xwNYFdz1Wr6e")
            ?: throw IllegalStateException("Failed to decode Quiet stretch salt")

    fun signNseAuthProof(challenge: ChallengePayload, privateKeyBytes: ByteArray): ProofPayload {
        if (privateKeyBytes.size != 32 && privateKeyBytes.size != 64) {
            throw IllegalStateException("Invalid private key length: ${privateKeyBytes.size}")
        }

        val seed = privateKeyBytes.copyOfRange(0, 32)
        val publicKey = ByteArray(32)
        val secretKey = ByteArray(64)
        if (!sodium.cryptoSignSeedKeypair(publicKey, secretKey, seed)) {
            throw IllegalStateException("Failed to derive Ed25519 keypair from device seed")
        }

        val payloadBytes = MsgpackEncoder.encodeNseAuthProof(challenge)
        val signature = ByteArray(64)
        if (!sodium.cryptoSignDetached(signature, payloadBytes, payloadBytes.size.toLong(), secretKey)) {
            throw IllegalStateException("Failed to sign challenge payload")
        }

        return ProofPayload(
            signature = CopperBase58.encode(signature),
        )
    }

    fun decryptNotificationMessage(logEntry: LogEntry, teamId: String): DecryptedNotificationMessage? {
        if (logEntry.communityId != teamId) {
            throw IllegalStateException("QSS entry community did not match requested team")
        }

        val outerEnvelope =
            MsgpackDecoder.decode(logEntry.entry) as? Map<*, *>
                ?: throw IllegalStateException("Outer QSS envelope was not a map")
        val outerEncrypted = parseQssEncryptedPayload(outerEnvelope["encrypted"], "outer QSS payload")

        val decryptedOrbitEntry = decryptPayload(outerEncrypted, teamId)
        val orbitEntry =
            decryptedOrbitEntry.value as? Map<*, *>
                ?: throw IllegalStateException("Decrypted OrbitDB entry was not a map")
        val payload = orbitEntry["payload"] as? Map<*, *> ?: return null
        val payloadValue = payload["value"] as? Map<*, *> ?: return null

        if (payloadValue["contents"] == null || payloadValue["channelId"] == null) {
            return null
        }

        val signature = parseSignature(payloadValue["encSignature"])
        val innerEncrypted = parseQssEncryptedPayload(payloadValue["contents"], "inner channel message")
        val decryptedInner = decryptPayload(innerEncrypted, teamId)
        val message = decryptedInner.value as? Map<*, *> ?: return null

        return validateDecryptedMessage(payloadValue, message, decryptedInner.bytes, signature, teamId)
    }

    internal fun validateDecryptedMessage(
        payloadValue: Map<*, *>,
        message: Map<*, *>,
        plaintext: ByteArray,
        signature: MessageSignature,
        teamId: String,
    ): DecryptedNotificationMessage? =
        authenticateNotificationMessage(
            payloadValue,
            message,
            plaintext,
            signature,
            teamId,
            lfaKeyLookup,
        ) { signatureBytes, payloadBytes, publicKeyBytes ->
            signatureVerifier?.invoke(signatureBytes, payloadBytes, publicKeyBytes)
                ?: sodium.cryptoSignVerifyDetached(signatureBytes, payloadBytes, payloadBytes.size, publicKeyBytes)
        }

    private fun decryptPayload(encryptedPayload: EncryptedPayload, teamId: String): DecryptedPayload {
        val keyName = makeKeyName(teamId, encryptedPayload.scope)
        val secretKey =
            lfaKeyLookup(keyName)
                ?: throw MissingQssNotificationKeyException(keyName)
        return decryptSymmetric(encryptedPayload.contents, secretKey)
    }

    private fun decryptSymmetric(cipherBytes: ByteArray, password: String): DecryptedPayload {
        val cipher =
            MsgpackDecoder.decode(cipherBytes) as? Map<*, *>
                ?: throw IllegalStateException("Cipher payload did not decode to a map")

        val nonce = byteArrayValue(cipher["nonce"])
            ?: throw IllegalStateException("Cipher payload missing nonce")
        val message = byteArrayValue(cipher["message"])
            ?: throw IllegalStateException("Cipher payload missing message")
        val tag = byteArrayValue(cipher["tag"])
            ?: throw IllegalStateException("Cipher payload missing tag")
        val mac = byteArrayValue(cipher["mac"])
            ?: throw IllegalStateException("Cipher payload missing mac")

        val derivedKey = stretch(password)
        val authMessage = nonce + mac
        if (!sodium.cryptoAuthVerify(tag, authMessage, authMessage.size.toLong(), derivedKey)) {
            throw IllegalStateException("Cipher tag verification failed")
        }

        val combinedCipher = mac + message
        val decrypted = ByteArray(message.size)
        if (!sodium.cryptoSecretBoxOpenEasy(
                decrypted,
                combinedCipher,
                combinedCipher.size.toLong(),
                nonce,
                derivedKey,
            )
        ) {
            throw IllegalStateException("secretbox open failed")
        }

        return DecryptedPayload(value = MsgpackDecoder.decode(decrypted), bytes = decrypted)
    }

    private fun stretch(password: String): ByteArray {
        val passwordBytes = password.toByteArray(Charsets.UTF_8)
        val output = ByteArray(32)

        val success =
            if (passwordBytes.size >= 16) {
                sodium.cryptoGenericHash(
                    output,
                    output.size,
                    passwordBytes,
                    passwordBytes.size.toLong(),
                    stretchSalt,
                    stretchSalt.size,
                )
            } else {
                sodium.cryptoPwHash(
                    output,
                    output.size,
                    passwordBytes,
                    passwordBytes.size,
                    stretchSalt,
                    PwHash.OPSLIMIT_INTERACTIVE,
                    PwHash.MEMLIMIT_INTERACTIVE,
                    PwHash.Alg.PWHASH_ALG_ARGON2ID13,
                )
            }

        if (!success) {
            throw IllegalStateException("Failed to stretch symmetric key material")
        }

        return output
    }

    internal fun parseSignature(value: Any?): MessageSignature = parseMessageSignature(value)

    private fun makeKeyName(teamId: String, scope: EncryptionScope): String {
        return "quiet_${teamId}_${scope.type}_${scope.name}_${scope.generation}_secret"
    }

    private fun byteArrayValue(value: Any?): ByteArray? {
        return when (value) {
            is ByteArray -> value
            is List<*> -> {
                val bytes = ByteArray(value.size)
                value.forEachIndexed { index, item ->
                    val number = item as? Number ?: return null
                    bytes[index] = number.toByte()
                }
                bytes
            }
            else -> null
        }
    }

    private fun stringValue(value: Any?): String? = value as? String

    private fun numberValue(value: Any?): Double? {
        val result = when (value) {
            is Number -> value.toDouble()
            is String -> value.toDoubleOrNull()
            else -> null
        }
        return result?.takeIf { it.isFinite() }
    }

    private fun decodeBase58(value: String): ByteArray? {
        return runCatching { CopperBase58.decode(value) }.getOrNull()
    }

    private data class DecryptedPayload(
        val value: Any?,
        val bytes: ByteArray,
    )
}
