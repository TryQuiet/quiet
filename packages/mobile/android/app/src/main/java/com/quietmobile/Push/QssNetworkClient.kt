package com.quietmobile.Push

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.HttpUrl.Companion.toHttpUrl
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class QssHttpException(val statusCode: Int, body: String?) :
    IOException("QSS request failed with HTTP $statusCode${body?.let { ": $it" } ?: ""}")

class QssNetworkClient(baseUrl: String) {
    private val baseUrl = baseUrl.toHttpUrl()
    private val client =
        OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .build()

    fun requestChallenge(deviceId: String, teamId: String): ChallengeResponse {
        val body = JSONObject()
            .put("deviceId", deviceId)
            .put("teamId", teamId)

        val json = post("nse-auth/challenge", body.toString(), null)
        val challengeJson = json.getJSONObject("challenge")
        return ChallengeResponse(
            challengeId = json.getString("challengeId"),
            challenge =
                ChallengePayload(
                    type = challengeJson.getString("type"),
                    name = challengeJson.getString("name"),
                    nonce = challengeJson.getString("nonce"),
                    timestamp = challengeJson.getLong("timestamp"),
                ),
        )
    }

    fun requestToken(challengeId: String, deviceId: String, proof: ProofPayload): TokenResponse {
        val body = JSONObject()
            .put("challengeId", challengeId)
            .put("deviceId", deviceId)
            .put(
                "proof",
                JSONObject()
                    .put("signature", proof.signature)
                    .put("publicKey", proof.publicKey),
            )

        val json = post("nse-auth/token", body.toString(), null)
        return TokenResponse(
            token = json.getString("token"),
            expiresIn = json.getInt("expiresIn"),
        )
    }

    fun fetchLogEntries(teamId: String, afterSeq: Long, token: String): LogEntriesResponse {
        val url =
            baseUrl.newBuilder()
                .addPathSegments("nse-auth/logs/$teamId")
                .addQueryParameter("afterSeq", afterSeq.toString())
                .build()

        val json =
            request(
                Request.Builder()
                    .url(url)
                    .get()
                    .header("Authorization", "Bearer $token")
                    .build(),
            )

        val entriesJson = json.getJSONArray("entries")
        val entries = mutableListOf<LogEntry>()
        for (index in 0 until entriesJson.length()) {
            entries.add(parseLogEntry(entriesJson.getJSONObject(index)))
        }

        return LogEntriesResponse(
            entries = entries,
            resolvedAfterSeq = json.optLong("resolvedAfterSeq", afterSeq),
        )
    }

    private fun post(path: String, body: String, bearerToken: String?): JSONObject {
        val requestBuilder =
            Request.Builder()
                .url(baseUrl.newBuilder().addPathSegments(path).build())
                .post(body.toRequestBody("application/json".toMediaType()))

        if (bearerToken != null) {
            requestBuilder.header("Authorization", "Bearer $bearerToken")
        }

        return request(requestBuilder.build())
    }

    private fun request(request: Request): JSONObject {
        client.newCall(request).execute().use { response ->
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                throw QssHttpException(response.code, body)
            }
            return JSONObject(body)
        }
    }

    private fun parseLogEntry(json: JSONObject): LogEntry {
        val entryBuffer = json.getJSONObject("entry")
        val dataArray = entryBuffer.getJSONArray("data")
        return LogEntry(
            cid = json.getString("cid"),
            hashedDbId = json.getString("hashedDbId"),
            communityId = json.getString("communityId"),
            entry = jsonArrayToBytes(dataArray),
            receivedAt = json.getString("receivedAt"),
            syncSeq = json.getLong("syncSeq"),
        )
    }

    private fun jsonArrayToBytes(array: JSONArray): ByteArray {
        val bytes = ByteArray(array.length())
        for (index in 0 until array.length()) {
            bytes[index] = array.getInt(index).toByte()
        }
        return bytes
    }
}
