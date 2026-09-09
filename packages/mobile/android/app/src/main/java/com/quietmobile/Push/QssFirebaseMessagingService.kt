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

internal const val MAX_MISSING_NOTIFICATION_KEY_FAILURES = 3

internal fun shouldRetryMissingNotificationKey(failureCount: Int): Boolean =
    failureCount in 1..MAX_MISSING_NOTIFICATION_KEY_FAILURES

internal fun <T> processContiguousQssEntries(
    afterSeq: Long,
    entries: List<LogEntry>,
    authenticate: (LogEntry) -> T?,
    present: (LogEntry, T) -> Unit,
    isPermanentRejection: (LogEntry, Exception) -> Boolean = { _, _ -> true },
    onAuthenticated: (LogEntry) -> Unit = {},
    onRejected: (LogEntry, Exception) -> Unit = { _, _ -> },
    onRetryableFailure: (LogEntry, Exception, Long) -> Unit = { _, _, _ -> },
    onPresentationFailure: (LogEntry, Exception, Long) -> Unit = { _, _, _ -> },
    onGap: (expected: Long, actual: Long, LogEntry) -> Unit = { _, _, _ -> },
): Long {
    var lastProcessedSeq = afterSeq
    val unseenEntries = entries.filter { it.syncSeq > afterSeq }.sortedBy { it.syncSeq }

    for (entry in unseenEntries) {
        if (entry.syncSeq <= lastProcessedSeq) continue
        if (entry.syncSeq != lastProcessedSeq + 1) {
            onGap(lastProcessedSeq + 1, entry.syncSeq, entry)
            break
        }

        val message =
            try {
                authenticate(entry)
            } catch (error: Exception) {
                if (!isPermanentRejection(entry, error)) {
                    onRetryableFailure(entry, error, lastProcessedSeq)
                    break
                }
                // Authentication failures are permanent for this immutable log entry. Consume
                // the rejected sequence so one malicious entry cannot poison the cursor.
                onRejected(entry, error)
                lastProcessedSeq = entry.syncSeq
                continue
            }

        onAuthenticated(entry)
        if (message == null) {
            lastProcessedSeq = entry.syncSeq
            continue
        }

        try {
            present(entry, message)
            lastProcessedSeq = entry.syncSeq
        } catch (error: Exception) {
            // A valid message that failed during presentation remains undelivered. Preserve the
            // cursor so a later provider wake-up can retry it and every entry after it.
            onPresentationFailure(entry, error, lastProcessedSeq)
            break
        }
    }

    return lastProcessedSeq
}

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
        val qssServerId = QuietStorage.getQssServerId(teamId)
        if (qssServerId == null) {
            Log.w(TAG, "Skipping push handling because no pinned QSS server identity is stored for teamId=$teamId")
            return
        }

        try {
            runBlocking(Dispatchers.IO) {
                handlePush(teamId, qssUrl, qssServerId)
            }
        } catch (error: Exception) {
            Log.e("QssFirebaseMessaging", "Failed handling QSS FCM message", error)
        }
    }

    private fun handlePush(teamId: String, qssUrl: String, qssServerId: String) {
        val authService =
            authServices.getOrPut(qssUrl) {
                QssAuthService(QssNetworkClient(qssUrl), cryptoService)
            }
        QssPushHandler(
            authService = authService,
            cryptoService = cryptoService,
            getLastSyncSeq = QuietStorage::getLastSyncSeq,
            saveLastSyncSeq = QuietStorage::saveLastSyncSeq,
            recordMissingNotificationKeyFailure = QuietStorage::recordMissingNotificationKeyFailure,
            clearMissingNotificationKeyFailure = QuietStorage::clearMissingNotificationKeyFailure,
            isAppForeground = QuietStorage::isAppForeground,
            getChannelName = QuietStorage::getChannelName,
            getNickname = QuietStorage::getNickname,
            getLocalUserId = QuietStorage::getLocalUserId,
            notify = notificationHandler::notify,
        ).handle(teamId, qssServerId)
    }

    companion object {
        private const val TAG = "QssFirebaseMessaging"
        private val cryptoService = QssCryptoService()
        private val authServices = ConcurrentHashMap<String, QssAuthService>()
    }
}

/**
 * Production orchestration for a background QSS push. Dependencies are narrow so the complete
 * challenge -> device proof -> token -> log fetch -> notification path can be exercised on the JVM.
 */
internal class QssPushHandler(
    private val authService: QssAuthService,
    private val cryptoService: QssMessageCrypto,
    private val getLastSyncSeq: (String) -> Long,
    private val saveLastSyncSeq: (Long, String) -> Unit,
    private val recordMissingNotificationKeyFailure: (String, Long) -> Int,
    private val clearMissingNotificationKeyFailure: (String, Long) -> Unit,
    private val isAppForeground: () -> Boolean,
    private val getChannelName: (String, String) -> String?,
    private val getNickname: (String) -> String?,
    private val getLocalUserId: (String) -> String?,
    private val notify: (String, String) -> Unit,
) {
    fun handle(teamId: String, qssServerId: String) {
        // Older installs receive this identity on the next main-app connection.
        // Leave the cursor unchanged until self can be identified reliably.
        val localUserId = getLocalUserId(teamId) ?: return
        val afterSeq = getLastSyncSeq(teamId)
        val entries = authService.fetchNewEntries(teamId, qssServerId, afterSeq).entries
        Log.i(TAG, "Fetched ${entries.size} entries for teamId=$teamId")

        val lastProcessedSeq =
            processContiguousQssEntries(
                afterSeq = afterSeq,
                entries = entries,
                authenticate = { entry ->
                    Log.d(TAG, "Decrypting QSS entry cid=${entry.cid} syncSeq=${entry.syncSeq}")
                    cryptoService.decryptNotificationMessage(entry, teamId)
                },
                present = { entry, message ->
                    if (message.userId == localUserId) {
                        return@processContiguousQssEntries
                    }
                    // Consume the entry without posting a notification for an unknown author.
                    val nickname = getNickname(message.userId)
                    if (nickname == null) {
                        Log.i(TAG, "Skipping notification for cid=${entry.cid} because author is unknown")
                        return@processContiguousQssEntries
                    }
                    val payload =
                        JSONObject()
                            .put("id", message.id)
                            .put("channelId", message.channelId)
                            .put("message", message.body)
                            .put("channelName", getChannelName(teamId, message.channelId))
                            .toString()
                    if (isAppForeground()) {
                        Log.i(TAG, "Skipping notification for cid=${entry.cid} because app returned to foreground")
                    } else {
                        Log.i(
                            TAG,
                            "Posting notification for cid=${entry.cid} channelId=${message.channelId} userId=${message.userId}",
                        )
                        notify(payload, nickname)
                    }
                },
                isPermanentRejection = { entry, error ->
                    if (error !is MissingQssNotificationKeyException) {
                        true
                    } else {
                        val failureCount = recordMissingNotificationKeyFailure(teamId, entry.syncSeq)
                        !shouldRetryMissingNotificationKey(failureCount)
                    }
                },
                onAuthenticated = { entry ->
                    clearMissingNotificationKeyFailure(teamId, entry.syncSeq)
                },
                onRejected = { entry, error ->
                    clearMissingNotificationKeyFailure(teamId, entry.syncSeq)
                    Log.e(TAG, "Rejecting invalid QSS log entry ${entry.cid}", error)
                },
                onRetryableFailure = { entry, error, cursor ->
                    Log.e(TAG, "Could not authenticate QSS entry ${entry.cid} yet; leaving cursor at $cursor", error)
                },
                onPresentationFailure = { entry, error, cursor ->
                    Log.e(TAG, "Failed presenting valid QSS log entry ${entry.cid}; leaving cursor at $cursor", error)
                },
                onGap = { expected, actual, entry ->
                    Log.w(
                        TAG,
                        "Stopping QSS entry processing because syncSeq is not contiguous. expected=$expected actual=$actual cid=${entry.cid}",
                    )
                },
            )

        if (lastProcessedSeq <= afterSeq) {
            Log.i(TAG, "No new sync sequence to persist for teamId=$teamId")
            return
        }

        saveLastSyncSeq(lastProcessedSeq, teamId)
        Log.i(TAG, "Saved lastSyncSeq=$lastProcessedSeq for teamId=$teamId")
    }

    companion object {
        private const val TAG = "QssFirebaseMessaging"
    }
}
