package com.quietmobile.Push

import com.apicatalog.base.Base58 as CopperBase58

object NseAuthProtocol {
    const val VERSION = 1
    const val SIGNATURE_CONTEXT = "quiet/qss-nse-auth/device-proof"
    const val MAXIMUM_LIFETIME_MS = 30_000L
    const val CLOCK_SKEW_MS = 5_000L
}

data class ChallengePayload(
    val protocolVersion: Int,
    val type: String,
    val deviceId: String,
    val teamId: String,
    val qssServerId: String,
    val challengeId: String,
    val nonce: String,
    val issuedAtMs: Long,
    val expiresAtMs: Long,
) {
    fun validate(expectedDeviceId: String, expectedTeamId: String, expectedQssServerId: String, nowMs: Long = System.currentTimeMillis()) {
        val nonceBytes = runCatching { CopperBase58.decode(nonce) }.getOrNull()
        require(protocolVersion == NseAuthProtocol.VERSION)
        require(type == "DEVICE")
        require(deviceId == expectedDeviceId)
        require(teamId == expectedTeamId)
        require(qssServerId == expectedQssServerId)
        require(challengeId.isNotEmpty())
        require(expiresAtMs > issuedAtMs)
        require(expiresAtMs - issuedAtMs <= NseAuthProtocol.MAXIMUM_LIFETIME_MS)
        require(issuedAtMs <= nowMs + NseAuthProtocol.CLOCK_SKEW_MS)
        require(expiresAtMs >= nowMs - NseAuthProtocol.CLOCK_SKEW_MS)
        require(nonceBytes?.size == 32)
        require(CopperBase58.encode(nonceBytes) == nonce)
    }
}

data class ChallengeResponse(
    val challengeId: String,
    val challenge: ChallengePayload,
)

data class ProofPayload(
    val signature: String,
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
