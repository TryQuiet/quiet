package com.quietmobile.Push

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.quietmobile.BuildConfig
import com.quietmobile.Communication.CommunicationModule
import com.quietmobile.Notification.NotificationHandler
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

class QssFirebaseMessagingService : FirebaseMessagingService() {
    private val notificationHandler by lazy { NotificationHandler(applicationContext) }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.i(TAG, "onNewToken received tokenLength=${token.length}")
        CommunicationModule.emitDeviceToken(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        Log.i(
            TAG,
            "onMessageReceived from=${message.from} dataKeys=${message.data.keys} hasNotification=${message.notification != null}",
        )

        if (BuildConfig.QSS_ALLOWED != "true") {
            Log.i(TAG, "Skipping push handling because QSS_ALLOWED=${BuildConfig.QSS_ALLOWED}")
            return
        }

        if (!QuietStorage.isTeamQssEnabled()) {
            Log.i(TAG, "Skipping push handling because team QSS is disabled")
            return
        }

        if (QuietStorage.isAppForeground()) {
            Log.i(TAG, "Skipping push handling because app is foregrounded")
            return
        }

        val teamId = message.data["teamId"]
        if (teamId == null) {
            Log.w(TAG, "Skipping push handling because teamId is missing from data payload")
            return
        }

        val qssUrl = QuietStorage.getQssUrl(teamId)
        if (qssUrl == null) {
            Log.w(TAG, "Skipping push handling because no QSS URL is stored for teamId=$teamId")
            return
        }

        try {
            runBlocking(Dispatchers.IO) {
                handlePush(teamId, qssUrl)
            }
        } catch (error: Exception) {
            Log.e("QssFirebaseMessaging", "Failed handling QSS FCM message", error)
        }
    }

    private fun handlePush(teamId: String, qssUrl: String) {
        val afterSeq = QuietStorage.getLastSyncSeq(teamId)
        Log.i(TAG, "Fetching QSS entries for teamId=$teamId qssUrl=$qssUrl afterSeq=$afterSeq")
        val authService =
            authServices.getOrPut(qssUrl) {
                QssAuthService(QssNetworkClient(qssUrl), cryptoService)
            }

        val entries = authService.fetchNewEntries(teamId, afterSeq).entries
        val unseenEntries = entries.filter { it.syncSeq > afterSeq }.sortedBy { it.syncSeq }
        Log.i(
            TAG,
            "Fetched ${entries.size} entries and ${unseenEntries.size} unseen entries for teamId=$teamId",
        )

        var lastProcessedSeq = afterSeq
        for (entry in unseenEntries) {
            if (entry.syncSeq <= lastProcessedSeq) {
                continue
            }
            if (entry.syncSeq != lastProcessedSeq + 1) {
                Log.w(
                    TAG,
                    "Stopping QSS entry processing because syncSeq is not contiguous. expected=${lastProcessedSeq + 1} actual=${entry.syncSeq} cid=${entry.cid}",
                )
                break
            }

            try {
                Log.d(TAG, "Decrypting QSS entry cid=${entry.cid} syncSeq=${entry.syncSeq}")
                val message = cryptoService.decryptNotificationMessage(entry, teamId)
                if (message == null) {
                    Log.i(
                        TAG,
                        "Skipping notification for cid=${entry.cid} because decrypted message was null",
                    )
                    lastProcessedSeq = entry.syncSeq
                    continue
                }
                val payload =
                    JSONObject()
                        .put("id", message.id)
                        .put("channelId", message.channelId)
                        .put("message", message.body)
                        .toString()
                val nickname = QuietStorage.getNickname(message.userId) ?: message.userId
                if (QuietStorage.isAppForeground()) {
                    Log.i(TAG, "Skipping notification for cid=${entry.cid} because app returned to foreground")
                    lastProcessedSeq = entry.syncSeq
                    continue
                }
                Log.i(
                    TAG,
                    "Posting notification for cid=${entry.cid} channelId=${message.channelId} userId=${message.userId}",
                )
                notificationHandler.notify(payload, nickname)
                lastProcessedSeq = entry.syncSeq
            } catch (error: Exception) {
                Log.e(TAG, "Failed processing QSS log entry ${entry.cid}; leaving cursor at $lastProcessedSeq", error)
                break
            }
        }

        if (lastProcessedSeq <= afterSeq) {
            Log.i(TAG, "No new sync sequence to persist for teamId=$teamId")
            return
        }

        QuietStorage.saveLastSyncSeq(lastProcessedSeq, teamId)
        Log.i(TAG, "Saved lastSyncSeq=$lastProcessedSeq for teamId=$teamId")
    }

    companion object {
        private const val TAG = "QssFirebaseMessaging"
        private val cryptoService = QssCryptoService()
        private val authServices = ConcurrentHashMap<String, QssAuthService>()
    }
}
