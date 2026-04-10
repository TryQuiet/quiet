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
        CommunicationModule.emitDeviceToken(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        if (BuildConfig.QSS_ALLOWED != "true") {
            return
        }

        if (!QuietStorage.isTeamQssEnabled()) {
            return
        }

        if (QuietStorage.isAppForeground()) {
            return
        }

        val teamId = message.data["teamId"] ?: return
        val qssUrl = QuietStorage.getQssUrl(teamId) ?: return

        try {
            runBlocking(Dispatchers.IO) {
                handlePush(teamId, qssUrl)
            }
        } catch (error: Exception) {
            Log.e("QssFirebaseMessaging", "Failed handling QSS FCM message", error)
        }
    }

    private fun handlePush(teamId: String, qssUrl: String) {
        val afterSeq = QuietStorage.getLastSyncSeq()
        val authService =
            authServices.getOrPut(qssUrl) {
                QssAuthService(QssNetworkClient(qssUrl), cryptoService)
            }

        val entries = authService.fetchNewEntries(teamId, afterSeq).entries
        val unseenEntries = entries.filter { it.syncSeq > afterSeq }.sortedBy { it.syncSeq }

        unseenEntries.forEach { entry ->
            try {
                val message = cryptoService.decryptNotificationMessage(entry, teamId) ?: return@forEach
                val payload =
                    JSONObject()
                        .put("channelId", message.channelId)
                        .put("message", message.body)
                        .toString()
                val nickname = QuietStorage.getNickname(message.userId) ?: message.userId
                notificationHandler.notify(payload, nickname)
            } catch (error: Exception) {
                Log.e("QssFirebaseMessaging", "Failed decrypting QSS log entry ${entry.cid}", error)
            }
        }

        val maxSyncSeq = unseenEntries.maxOfOrNull { it.syncSeq } ?: return
        QuietStorage.saveLastSyncSeq(maxSyncSeq, teamId)
    }

    companion object {
        private val cryptoService = QssCryptoService()
        private val authServices = ConcurrentHashMap<String, QssAuthService>()
    }
}
