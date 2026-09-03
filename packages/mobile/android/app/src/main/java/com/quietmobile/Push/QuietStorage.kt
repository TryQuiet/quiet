package com.quietmobile.Push

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.apicatalog.base.Base58 as CopperBase58
import org.json.JSONObject

internal data class MissingNotificationKeyRetryState(
    val syncSeq: Long,
    val failureCount: Int,
)

internal fun nextMissingNotificationKeyRetryState(
    previous: MissingNotificationKeyRetryState?,
    syncSeq: Long,
): MissingNotificationKeyRetryState {
    val previousCount = if (previous?.syncSeq == syncSeq) previous.failureCount else 0
    val nextCount = if (previousCount == Int.MAX_VALUE) Int.MAX_VALUE else previousCount + 1
    return MissingNotificationKeyRetryState(syncSeq, nextCount)
}

object QuietStorage {
    private const val ENCRYPTED_PREFS_NAME = "quiet.secure.storage"
    private const val REGULAR_PREFS_NAME = "quiet.storage"

    private const val DEVICE_ID_KEY = "quiet.device.id"
    private const val TEAM_ID_KEY = "quiet.team.id"
    private const val DEVICE_PRIVATE_KEY_PREFIX = "quiet.device.privateKey."
    private const val QSS_URLS_KEY = "quiet.nse.qssUrls"
    private const val QSS_CONFIGURATIONS_KEY = "quiet.nse.qssConfigurations"
    private const val LAST_SYNC_SEQ_KEY = "quiet.nse.lastSyncSeq"
    private const val LAST_SYNC_TEAM_ID_KEY = "quiet.nse.lastSyncTeamId"
    private const val LAST_SYNC_SEQ_BY_TEAM_PREFIX = "quiet.nse.lastSyncSeq."
    private const val MISSING_KEY_RETRY_SEQ_BY_TEAM_PREFIX = "quiet.nse.missingKeyRetrySeq."
    private const val MISSING_KEY_RETRY_COUNT_BY_TEAM_PREFIX = "quiet.nse.missingKeyRetryCount."
    private const val APP_FOREGROUND_KEY = "quiet.app.isForeground"
    private const val TEAM_QSS_ENABLED_KEY = "quiet.qss.team.enabled"
    private const val USER_BACKGROUND_TOR_ENABLED_KEY = "quiet.qss.backgroundTor.enabled"
    private const val USER_METADATA_KEY = "quiet.user.metadata"
    private const val DISPLAYED_NOTIFICATION_HASHES_KEY = "quiet.notification.displayedHashes"
    private const val DISPLAYED_NOTIFICATION_HASHES_TTL_MS = 24L * 60L * 60L * 1000L
    private const val DISPLAYED_NOTIFICATION_HASHES_MAX_SIZE = 512
    private const val CHANNEL_METADATA_KEY_PREFIX = "quiet.channelMetadata."

    @Volatile
    private var applicationContext: Context? = null

    @Volatile
    private var encryptedPrefs: SharedPreferences? = null

    @Volatile
    private var regularPrefs: SharedPreferences? = null

    @JvmStatic
    fun init(context: Context) {
        if (applicationContext == null) {
            applicationContext = context.applicationContext
        }
    }

    @JvmStatic
    fun saveDeviceCredentials(deviceId: String, teamId: String, signingPrivateKey: String) {
        securePrefs().edit()
            .putString(DEVICE_ID_KEY, deviceId)
            .putString(TEAM_ID_KEY, teamId)
            .putString("$DEVICE_PRIVATE_KEY_PREFIX$deviceId", signingPrivateKey)
            .apply()
    }

    @JvmStatic
    fun getDeviceId(): String? = securePrefs().getString(DEVICE_ID_KEY, null)

    @JvmStatic
    fun getDevicePrivateKey(deviceId: String): ByteArray? {
        val encoded = securePrefs().getString("$DEVICE_PRIVATE_KEY_PREFIX$deviceId", null) ?: return null
        return runCatching { CopperBase58.decode(encoded) }.getOrNull()
    }

    @JvmStatic
    fun addLfaKey(keyName: String, key: String) {
        securePrefs().edit().putString(keyName, key).apply()
    }

    @JvmStatic
    fun getLfaKey(keyName: String): String? = securePrefs().getString(keyName, null)

    @JvmStatic
    fun addChannelMetadata(teamId: String, channelId: String, channelName: String) {
        val keyName = QuietStorage.generateChannelMetadataKeyName(teamId, channelId)
        securePrefs().edit().putString(keyName, channelName).apply()
    }

    @JvmStatic
    fun getChannelName(teamId: String, channelId: String): String? {
        val keyName = QuietStorage.generateChannelMetadataKeyName(teamId, channelId)
        return securePrefs().getString(keyName, null)
    }

    @JvmStatic
    fun generateChannelMetadataKeyName(teamId: String, channelId: String): String {
        return "$CHANNEL_METADATA_KEY_PREFIX$teamId.$channelId"
    }

    @JvmStatic
    fun saveQssConfiguration(teamId: String, url: String, serverId: String) {
        val current = JSONObject(regularPrefs().getString(QSS_CONFIGURATIONS_KEY, "{}") ?: "{}")
        if (url.isEmpty() || serverId.isEmpty()) {
            current.remove(teamId)
        } else {
            current.put(teamId, JSONObject().put("url", url).put("serverId", serverId))
        }
        regularPrefs().edit().putString(QSS_CONFIGURATIONS_KEY, current.toString()).apply()
    }

    @JvmStatic
    fun getQssUrl(teamId: String): String? {
        val configurations = JSONObject(regularPrefs().getString(QSS_CONFIGURATIONS_KEY, "{}") ?: "{}")
        configurations.optJSONObject(teamId)?.optString("url")?.takeIf { it.isNotEmpty() }?.let { return it }
        val current = JSONObject(regularPrefs().getString(QSS_URLS_KEY, "{}") ?: "{}")
        return if (current.has(teamId)) current.optString(teamId) else null
    }

    @JvmStatic
    fun getQssServerId(teamId: String): String? {
        val configurations = JSONObject(regularPrefs().getString(QSS_CONFIGURATIONS_KEY, "{}") ?: "{}")
        return configurations.optJSONObject(teamId)?.optString("serverId")?.takeIf { it.isNotEmpty() }
    }

    @JvmStatic
    fun saveLastSyncSeq(seq: Long, teamId: String) {
        val current = getLastSyncSeq(teamId)
        if (seq <= current) {
            return
        }
        regularPrefs().edit()
            .putLong(lastSyncSeqKey(teamId), seq)
            .remove(LAST_SYNC_SEQ_KEY)
            .remove(LAST_SYNC_TEAM_ID_KEY)
            .apply()
    }

    @JvmStatic
    fun getLastSyncSeq(teamId: String): Long {
        val prefs = regularPrefs()
        val keyedSeq = prefs.getLong(lastSyncSeqKey(teamId), 0L)
        if (keyedSeq > 0L) {
            return keyedSeq
        }

        val legacyTeamId = prefs.getString(LAST_SYNC_TEAM_ID_KEY, null)
        if (legacyTeamId == teamId) {
            return prefs.getLong(LAST_SYNC_SEQ_KEY, 0L)
        }

        return 0L
    }

    /**
     * Record a missing notification key for the entry currently blocking this team's cursor.
     * Only one sequence can block a team's contiguous cursor, so a different sequence resets the
     * bounded counter instead of growing an attacker-controlled preference map.
     */
    @JvmStatic
    @Synchronized
    fun recordMissingNotificationKeyFailure(teamId: String, syncSeq: Long): Int {
        val prefs = regularPrefs()
        val sequenceKey = missingKeyRetrySeqKey(teamId)
        val countKey = missingKeyRetryCountKey(teamId)
        val previous =
            if (prefs.contains(sequenceKey)) {
                MissingNotificationKeyRetryState(
                    prefs.getLong(sequenceKey, -1L),
                    prefs.getInt(countKey, 0),
                )
            } else {
                null
            }
        val next = nextMissingNotificationKeyRetryState(previous, syncSeq)
        prefs.edit().putLong(sequenceKey, next.syncSeq).putInt(countKey, next.failureCount).apply()
        return next.failureCount
    }

    @JvmStatic
    @Synchronized
    fun clearMissingNotificationKeyFailure(teamId: String, syncSeq: Long) {
        val prefs = regularPrefs()
        val sequenceKey = missingKeyRetrySeqKey(teamId)
        if (prefs.getLong(sequenceKey, -1L) != syncSeq) return
        prefs.edit()
            .remove(sequenceKey)
            .remove(missingKeyRetryCountKey(teamId))
            .apply()
    }

    @JvmStatic
    fun setAppForeground(foreground: Boolean) {
        regularPrefs().edit().putBoolean(APP_FOREGROUND_KEY, foreground).apply()
    }

    @JvmStatic
    fun isAppForeground(): Boolean = regularPrefs().getBoolean(APP_FOREGROUND_KEY, false)

    @JvmStatic
    fun setTeamQssEnabled(enabled: Boolean) {
        regularPrefs().edit().putBoolean(TEAM_QSS_ENABLED_KEY, enabled).apply()
    }

    @JvmStatic
    fun isTeamQssEnabled(): Boolean = regularPrefs().getBoolean(TEAM_QSS_ENABLED_KEY, false)

    @JvmStatic
    fun setUserBackgroundTorEnabled(enabled: Boolean) {
        regularPrefs().edit().putBoolean(USER_BACKGROUND_TOR_ENABLED_KEY, enabled).apply()
    }

    @JvmStatic
    fun isUserBackgroundTorEnabled(): Boolean =
        regularPrefs().getBoolean(USER_BACKGROUND_TOR_ENABLED_KEY, false)

    @JvmStatic
    fun saveUserMetadata(userId: String, nickname: String) {
        val current = JSONObject(regularPrefs().getString(USER_METADATA_KEY, "{}") ?: "{}")
        current.put(userId, nickname)
        regularPrefs().edit().putString(USER_METADATA_KEY, current.toString()).apply()
    }

    @JvmStatic
    fun getNickname(userId: String): String? {
        val current = JSONObject(regularPrefs().getString(USER_METADATA_KEY, "{}") ?: "{}")
        return if (current.has(userId)) current.optString(userId) else null
    }

    @JvmStatic
    @Synchronized
    fun consumeDisplayedNotificationHash(message: String?): Boolean {
        val hash = notificationHash(message) ?: return false
        val hashes = prunedDisplayedNotificationHashes()
        if (!hashes.has(hash)) {
            saveDisplayedNotificationHashes(hashes)
            return false
        }

        hashes.remove(hash)
        saveDisplayedNotificationHashes(hashes)
        return true
    }

    @JvmStatic
    @Synchronized
    fun recordDisplayedNotificationHashIfNew(message: JSONObject): Boolean {
        val hash = notificationHash(message) ?: return true
        val hashes = prunedDisplayedNotificationHashes()
        if (hashes.has(hash)) {
            saveDisplayedNotificationHashes(hashes)
            return false
        }

        hashes.put(hash, System.currentTimeMillis())
        saveDisplayedNotificationHashes(pruneDisplayedNotificationHashes(hashes))
        return true
    }

    @JvmStatic
    fun clearAll() {
        securePrefs().edit().clear().apply()
        regularPrefs().edit().clear().apply()
    }

    @Synchronized
    private fun securePrefs(): SharedPreferences {
        encryptedPrefs?.let { return it }

        val context = requireContext()
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        val prefs = EncryptedSharedPreferences.create(
            context,
            ENCRYPTED_PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
        encryptedPrefs = prefs
        return prefs
    }

    @Synchronized
    private fun regularPrefs(): SharedPreferences {
        regularPrefs?.let { return it }
        val prefs = requireContext().getSharedPreferences(REGULAR_PREFS_NAME, Context.MODE_PRIVATE)
        regularPrefs = prefs
        return prefs
    }

    private fun requireContext(): Context {
        return applicationContext
            ?: throw IllegalStateException("QuietStorage.init(context) must be called before use")
    }

    private fun lastSyncSeqKey(teamId: String): String = "$LAST_SYNC_SEQ_BY_TEAM_PREFIX$teamId"

    private fun missingKeyRetrySeqKey(teamId: String): String = "$MISSING_KEY_RETRY_SEQ_BY_TEAM_PREFIX$teamId"

    private fun missingKeyRetryCountKey(teamId: String): String = "$MISSING_KEY_RETRY_COUNT_BY_TEAM_PREFIX$teamId"

    private fun notificationHash(message: String?): String? {
        if (message.isNullOrBlank()) {
            return null
        }

        return try {
            notificationHash(JSONObject(message))
        } catch (_: Exception) {
            null
        }
    }

    private fun notificationHash(message: JSONObject): String? {
        val id = message.optString("id", "")
        val channelId = message.optString("channelId", "")
        if (id.isBlank() || channelId.isBlank()) {
            return null
        }
        return "$channelId:$id"
    }

    private fun prunedDisplayedNotificationHashes(): JSONObject {
        val current = JSONObject(regularPrefs().getString(DISPLAYED_NOTIFICATION_HASHES_KEY, "{}") ?: "{}")
        return pruneDisplayedNotificationHashes(current)
    }

    private fun pruneDisplayedNotificationHashes(current: JSONObject): JSONObject {
        val cutoff = System.currentTimeMillis() - DISPLAYED_NOTIFICATION_HASHES_TTL_MS
        val records = mutableListOf<DisplayedNotificationHash>()
        val keys = current.keys()

        while (keys.hasNext()) {
            val hash = keys.next()
            val timestamp = current.optLong(hash, 0L)
            if (timestamp >= cutoff) {
                records.add(DisplayedNotificationHash(hash, timestamp))
            }
        }

        records.sortByDescending { it.timestamp }

        val pruned = JSONObject()
        records
            .take(DISPLAYED_NOTIFICATION_HASHES_MAX_SIZE)
            .forEach { record -> pruned.put(record.hash, record.timestamp) }
        return pruned
    }

    private fun saveDisplayedNotificationHashes(hashes: JSONObject) {
        regularPrefs()
            .edit()
            .putString(DISPLAYED_NOTIFICATION_HASHES_KEY, hashes.toString())
            .apply()
    }

    private data class DisplayedNotificationHash(
        val hash: String,
        val timestamp: Long,
    )
}
