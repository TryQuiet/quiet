package com.quietmobile.Push

import java.util.Date

class QssAuthService(
    private val client: QssNetworkClient,
    private val crypto: QssCryptoService,
) {
    private data class CachedToken(
        val token: String,
        val expiry: Date,
    )

    private val tokenCache = mutableMapOf<String, CachedToken>()

    fun authenticate(deviceId: String, teamId: String, qssServerId: String): String {
        val cacheKey = "$teamId:$qssServerId"
        val cached = tokenCache[cacheKey]
        if (cached != null && cached.expiry.after(Date())) {
            return cached.token
        }

        val challenge = client.requestChallenge(deviceId, teamId)
        require(challenge.challengeId == challenge.challenge.challengeId)
        challenge.challenge.validate(deviceId, teamId, qssServerId)
        val privateKey =
            QuietStorage.getDevicePrivateKey(deviceId)
                ?: throw IllegalStateException("Missing device private key for $deviceId")
        val proof = crypto.signNseAuthProof(challenge.challenge, privateKey)
        val tokenResponse = client.requestToken(challenge.challengeId, deviceId, proof)

        tokenCache[cacheKey] =
            CachedToken(
                token = tokenResponse.token,
                expiry = Date(System.currentTimeMillis() + ((tokenResponse.expiresIn - 30) * 1000L)),
            )
        return tokenResponse.token
    }

    fun fetchNewEntries(teamId: String, qssServerId: String, afterSeq: Long): LogEntriesResponse {
        val deviceId =
            QuietStorage.getDeviceId()
                ?: throw IllegalStateException("Missing QSS device id in QuietStorage")
        val token = authenticate(deviceId, teamId, qssServerId)

        return try {
            client.fetchLogEntries(teamId, afterSeq, token)
        } catch (error: QssHttpException) {
            if (error.statusCode != 401) {
                throw error
            }

            tokenCache.remove("$teamId:$qssServerId")
            val refreshedToken = authenticate(deviceId, teamId, qssServerId)
            client.fetchLogEntries(teamId, afterSeq, refreshedToken)
        }
    }
}
