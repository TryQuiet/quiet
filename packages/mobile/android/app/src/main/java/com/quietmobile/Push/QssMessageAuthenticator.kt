package com.quietmobile.Push

import com.apicatalog.base.Base58 as CopperBase58

internal class MissingQssNotificationKeyException(keyName: String) :
    IllegalStateException("Missing LFA key for scope $keyName")

internal data class MessageSignature(
    val signature: String,
    val author: SignatureAuthor,
)

internal data class SignatureAuthor(
    val type: String,
    val name: String,
    val generation: Int,
)

internal fun parseMessageSignature(value: Any?): MessageSignature {
    val dict = value as? Map<*, *> ?: throw IllegalStateException("Message signature was not an object")
    val author = dict["author"] as? Map<*, *>
        ?: throw IllegalStateException("Message signature author was malformed")
    return MessageSignature(
        signature = dict["signature"] as? String
            ?: throw IllegalStateException("Message signature missing signature"),
        author =
            SignatureAuthor(
                type = author["type"] as? String
                    ?: throw IllegalStateException("Message signature author.type missing"),
                name = author["name"] as? String
                    ?: throw IllegalStateException("Message signature author.name missing"),
                generation = (author["generation"] as? Number)?.toInt()
                    ?: throw IllegalStateException("Message signature author.generation missing"),
            ),
    )
}

internal fun authenticateNotificationMessage(
    payloadValue: Map<*, *>,
    message: Map<*, *>,
    plaintext: ByteArray,
    signature: MessageSignature,
    teamId: String,
    lfaKeyLookup: (String) -> String?,
    verifySignature: (signature: ByteArray, payload: ByteArray, publicKey: ByteArray) -> Boolean,
): DecryptedNotificationMessage? {
    val id = message["id"] as? String ?: return null
    val channelId = message["channelId"] as? String ?: return null
    val userId = message["userId"] as? String ?: return null
    val messageTeamId = message["teamId"] as? String ?: return null
    val createdAt = numberValue(message["createdAt"]) ?: return null
    val type = (message["type"] as? Number)?.toInt() ?: return null
    val body = notificationBody(message, type) ?: return null

    if (id.isEmpty() || channelId.isEmpty() || userId.isEmpty() || messageTeamId.isEmpty() || type <= 0) {
        throw IllegalStateException("Decrypted message shape was invalid")
    }
    if (signature.author.type != "USER" || signature.author.name != userId) {
        throw IllegalStateException("Message signature author did not match message userId")
    }
    if (
        payloadValue["id"] as? String != id ||
        payloadValue["channelId"] as? String != channelId ||
        payloadValue["teamId"] as? String != messageTeamId ||
        messageTeamId != teamId ||
        numberValue(payloadValue["createdAt"]) != createdAt
    ) {
        throw IllegalStateException("Inner message fields did not match its encrypted envelope")
    }

    val signatureBytes = decodeBase58(signature.signature)
    if (signatureBytes.size != 64) {
        throw IllegalStateException("Invalid message signature length: ${signatureBytes.size}")
    }

    // Only a structurally valid, internally consistent immutable entry may enter the retryable
    // missing-key path. Otherwise an attacker can combine malformed signature material with an
    // unknown generation and pin the notification cursor forever.
    val keyName = "quiet_${teamId}_${signature.author.type}_${signature.author.name}_${signature.author.generation}_userSig"
    val publicKey = lfaKeyLookup(keyName) ?: throw MissingQssNotificationKeyException(keyName)
    val publicKeyBytes = decodeBase58(publicKey)
    if (publicKeyBytes.size != 32) {
        throw IllegalStateException("Invalid user signature public key length: ${publicKeyBytes.size}")
    }

    val payloadBytes = MsgpackEncoder.withSignatureContext("lf/auth/team-message", plaintext)
    if (!verifySignature(signatureBytes, payloadBytes, publicKeyBytes)) {
        throw IllegalStateException("Message signature verification failed")
    }

    return DecryptedNotificationMessage(id, channelId, userId, body, type)
}

private fun decodeBase58(value: String): ByteArray =
    runCatching { CopperBase58.decode(value) }
        .getOrElse { throw IllegalStateException("Message signature material was not valid base58", it) }

private fun numberValue(value: Any?): Double? =
    (value as? Number)?.toDouble()?.takeIf { it.isFinite() }

private fun notificationBody(message: Map<*, *>, type: Int): String? {
    val trimmed = (message["message"] as? String)?.trim().orEmpty()
    if (trimmed.isNotEmpty()) return trimmed
    return when (type) {
        2 -> "Sent an image"
        4 -> "Sent a file"
        else -> null
    }
}
