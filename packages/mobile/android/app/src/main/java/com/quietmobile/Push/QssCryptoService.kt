package com.quietmobile.Push

import com.apicatalog.base.Base58 as CopperBase58
import com.goterl.lazysodium.LazySodiumAndroid
import com.goterl.lazysodium.SodiumAndroid
import com.goterl.lazysodium.interfaces.PwHash

class QssCryptoService {
    private val sodium = LazySodiumAndroid(SodiumAndroid())

    private val stretchSalt: ByteArray =
        decodeBase58("H5B4DLSXw5xwNYFdz1Wr6e")
            ?: throw IllegalStateException("Failed to decode Quiet stretch salt")

    fun signChallengePayload(challenge: ChallengePayload, privateKeyBytes: ByteArray): ProofPayload {
        if (privateKeyBytes.size != 32 && privateKeyBytes.size != 64) {
            throw IllegalStateException("Invalid private key length: ${privateKeyBytes.size}")
        }

        val seed = privateKeyBytes.copyOfRange(0, 32)
        val publicKey = ByteArray(32)
        val secretKey = ByteArray(64)
        if (!sodium.cryptoSignSeedKeypair(publicKey, secretKey, seed)) {
            throw IllegalStateException("Failed to derive Ed25519 keypair from device seed")
        }

        val payloadBytes = MsgpackEncoder.encodeChallenge(challenge)
        val signature = ByteArray(64)
        if (!sodium.cryptoSignDetached(signature, payloadBytes, payloadBytes.size.toLong(), secretKey)) {
            throw IllegalStateException("Failed to sign challenge payload")
        }

        return ProofPayload(
            signature = CopperBase58.encode(signature),
            publicKey = CopperBase58.encode(publicKey),
        )
    }

    fun decryptNotificationMessage(logEntry: LogEntry, teamId: String): DecryptedNotificationMessage? {
        val outerEnvelope =
            MsgpackDecoder.decode(logEntry.entry) as? Map<*, *>
                ?: throw IllegalStateException("Outer QSS envelope was not a map")
        val outerEncrypted = parseEncryptedPayload(outerEnvelope["encrypted"], "outer QSS payload")

        val orbitEntry =
            decryptPayload(outerEncrypted, teamId) as? Map<*, *>
                ?: throw IllegalStateException("Decrypted OrbitDB entry was not a map")
        val payload = orbitEntry["payload"] as? Map<*, *> ?: return null
        val payloadValue = payload["value"] as? Map<*, *> ?: return null

        if (payloadValue["contents"] == null || payloadValue["channelId"] == null) {
            return null
        }

        val signature = parseSignature(payloadValue["encSignature"])
        val innerEncrypted = parseEncryptedPayload(payloadValue["contents"], "inner channel message")
        val message = decryptPayload(innerEncrypted, teamId) as? Map<*, *> ?: return null

        if (!verifyMessageSignature(message, signature, teamId)) {
            throw IllegalStateException("Message signature verification failed")
        }

        val id = stringValue(message["id"]) ?: return null
        val channelId = stringValue(message["channelId"]) ?: return null
        val userId = stringValue(message["userId"]) ?: return null
        val type = intValue(message["type"]) ?: return null
        val body = notificationBody(message, type) ?: return null

        return DecryptedNotificationMessage(
            id = id,
            channelId = channelId,
            userId = userId,
            body = body,
            type = type,
        )
    }

    private fun verifyMessageSignature(message: Map<*, *>, signature: MessageSignature, teamId: String): Boolean {
        val publicKeyName = makeUserSignatureKeyName(teamId, signature.author)
        val publicKey =
            QuietStorage.getLfaKey(publicKeyName)
                ?: throw IllegalStateException("Missing user signature public key for scope $publicKeyName")
        val signatureBytes =
            decodeBase58(signature.signature)
                ?: throw IllegalStateException("Message signature was not valid base58")
        val publicKeyBytes =
            decodeBase58(publicKey)
                ?: throw IllegalStateException("User signature public key was not valid base58")
        if (signatureBytes.size != 64) {
            throw IllegalStateException("Invalid message signature length: ${signatureBytes.size}")
        }
        if (publicKeyBytes.size != 32) {
            throw IllegalStateException("Invalid user signature public key length: ${publicKeyBytes.size}")
        }

        val payloadBytes = MsgpackEncoder.encode(message)
        return sodium.cryptoSignVerifyDetached(signatureBytes, payloadBytes, payloadBytes.size, publicKeyBytes)
    }

    private fun notificationBody(message: Map<*, *>, type: Int): String? {
        val trimmed = stringValue(message["message"])?.trim().orEmpty()
        if (trimmed.isNotEmpty()) {
            return trimmed
        }

        return when (type) {
            2 -> "Sent an image"
            4 -> "Sent a file"
            else -> null
        }
    }

    private fun decryptPayload(encryptedPayload: EncryptedPayload, teamId: String): Any? {
        val keyName = makeKeyName(teamId, encryptedPayload.scope)
        val secretKey =
            QuietStorage.getLfaKey(keyName)
                ?: throw IllegalStateException("Missing LFA key for scope $keyName")
        return decryptSymmetric(encryptedPayload.contents, secretKey)
    }

    private fun decryptSymmetric(cipherBytes: ByteArray, password: String): Any? {
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

        return MsgpackDecoder.decode(decrypted)
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

    private fun parseEncryptedPayload(value: Any?, label: String): EncryptedPayload {
        val dict = value as? Map<*, *> ?: throw IllegalStateException("$label was not an object")
        val contents =
            byteArrayValue(dict["contents"])
                ?: throw IllegalStateException("$label contents were not binary")
        val scope = dict["scope"] as? Map<*, *>
            ?: throw IllegalStateException("$label scope was malformed")

        return EncryptedPayload(
            contents = contents,
            scope =
                EncryptionScope(
                    type = stringValue(scope["type"])
                        ?: throw IllegalStateException("$label scope.type missing"),
                    name = stringValue(scope["name"])
                        ?: throw IllegalStateException("$label scope.name missing"),
                    generation = intValue(scope["generation"])
                        ?: throw IllegalStateException("$label scope.generation missing"),
                ),
        )
    }

    private fun parseSignature(value: Any?): MessageSignature {
        val dict = value as? Map<*, *> ?: throw IllegalStateException("Message signature was not an object")
        val author = dict["author"] as? Map<*, *>
            ?: throw IllegalStateException("Message signature author was malformed")
        return MessageSignature(
            signature = stringValue(dict["signature"])
                ?: throw IllegalStateException("Message signature missing signature"),
            author = SignatureAuthor(
                type = stringValue(author["type"])
                    ?: throw IllegalStateException("Message signature author.type missing"),
                name = stringValue(author["name"])
                    ?: throw IllegalStateException("Message signature author.name missing"),
                generation = intValue(author["generation"])
                    ?: throw IllegalStateException("Message signature author.generation missing"),
            ),
        )
    }

    private fun makeKeyName(teamId: String, scope: EncryptionScope): String {
        return "quiet_${teamId}_${scope.type}_${scope.name}_${scope.generation}_secret"
    }

    private fun makeUserSignatureKeyName(teamId: String, author: SignatureAuthor): String {
        return "quiet_${teamId}_${author.type}_${author.name}_${author.generation}_userSig"
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

    private fun intValue(value: Any?): Int? {
        return when (value) {
            is Number -> value.toInt()
            is String -> value.toIntOrNull()
            else -> null
        }
    }

    private fun decodeBase58(value: String): ByteArray? {
        return runCatching { CopperBase58.decode(value) }.getOrNull()
    }

    private data class MessageSignature(
        val signature: String,
        val author: SignatureAuthor,
    )

    private data class SignatureAuthor(
        val type: String,
        val name: String,
        val generation: Int,
    )
}
