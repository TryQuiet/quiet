package com.quietmobile.Push

data class ChallengePayload(
    val type: String,
    val name: String,
    val nonce: String,
    val timestamp: Long,
)

data class ChallengeResponse(
    val challengeId: String,
    val challenge: ChallengePayload,
)

data class ProofPayload(
    val signature: String,
    val publicKey: String,
)

data class TokenResponse(
    val token: String,
    val expiresIn: Int,
)

data class LogEntry(
    val cid: String,
    val hashedDbId: String,
    val communityId: String,
    val entry: ByteArray,
    val receivedAt: String,
    val syncSeq: Long,
)

data class LogEntriesResponse(
    val entries: List<LogEntry>,
    val resolvedAfterSeq: Long,
)

data class DecryptedNotificationMessage(
    val id: String,
    val channelId: String,
    val userId: String,
    val body: String,
    val type: Int,
)

data class EncryptionScope(
    val type: String,
    val name: String,
    val generation: Int,
)

data class EncryptedPayload(
    val contents: ByteArray,
    val scope: EncryptionScope,
)
