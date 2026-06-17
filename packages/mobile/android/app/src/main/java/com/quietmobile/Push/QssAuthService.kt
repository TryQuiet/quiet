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

    fun authenticate(deviceId: String, teamId: String): String {
        val cached = tokenCache[teamId]
        if (cached != null && cached.expiry.after(Date())) {
            return cached.token
        }

        val challenge = client.requestChallenge(deviceId, teamId)
        val privateKey =
            QuietStorage.getDevicePrivateKey(deviceId)
                ?: throw IllegalStateException("Missing device private key for $deviceId")
        val proof = crypto.signChallengePayload(challenge.challenge, privateKey)
        val tokenResponse = client.requestToken(challenge.challengeId, deviceId, proof)

        tokenCache[teamId] =
            CachedToken(
                token = tokenResponse.token,
                expiry = Date(System.currentTimeMillis() + ((tokenResponse.expiresIn - 30) * 1000L)),
            )
        return tokenResponse.token
    }

    fun fetchNewEntries(teamId: String, afterSeq: Long): LogEntriesResponse {
        val deviceId =
            QuietStorage.getDeviceId()
                ?: throw IllegalStateException("Missing QSS device id in QuietStorage")
        val token = authenticate(deviceId, teamId)

        return try {
            client.fetchLogEntries(teamId, afterSeq, token)
        } catch (error: QssHttpException) {
            if (error.statusCode != 401) {
                throw error
            }

            tokenCache.remove(teamId)
            val refreshedToken = authenticate(deviceId, teamId)
            client.fetchLogEntries(teamId, afterSeq, refreshedToken)
        }
    }
}
