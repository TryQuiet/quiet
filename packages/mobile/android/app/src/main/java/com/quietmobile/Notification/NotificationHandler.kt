package com.quietmobile.Notification

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.quietmobile.MainActivity
import com.quietmobile.Push.QuietStorage
import com.quietmobile.R
import com.quietmobile.Utils.Const
import org.json.JSONException
import org.json.JSONObject

class NotificationHandler(private val context: Context) {

    /**
     * @param message - Object of type ChannelMessage
     */
    fun notify(message: String, username: String?) {
        val jsonMessage: JSONObject = try {
            JSONObject(message)
        } catch (e: JSONException) {
            Log.e(TAG, "unexpected JSON exception", e)
            return
        }

        // Parse user name
        val user = String.format("@%s", username)

        try {
            val channelId = String.format("#%s", jsonMessage.getString("channelId"))
            // Parse channel name
            val index = channelId.indexOf('_')
            val channelName = if (index == -1) {
                channelId
            } else {
                channelId.substringBefore('_')
            }
            // Parse message content
            val content = String.format("%s", jsonMessage.getString("message"))
            if (!logNotificationState()) {
                Log.i(TAG, "Skipping notification because notifications are disabled or permission is missing")
                return
            }
            if (!QuietStorage.recordDisplayedNotificationHashIfNew(jsonMessage)) {
                Log.i(TAG, "Skipping notification because message was already displayed")
                return
            }
            // Keep all notifications under application's group
            val group = context.getString(R.string.app_name)
            createGroup(group)

            composeNotification(channelId, channelName, user, content, group)

        } catch (e: JSONException) {
            Log.e(TAG, "incorrect NOTIFICATION payload", e)
            return
        }

    }

    private fun createGroup(group: String) {
        val id = group.hashCode()

        val intent = Intent(
            context,
            MainActivity::class.java
        )

        intent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP

        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

        @SuppressLint("LaunchActivityFromNotification") val pendingIntent =
            PendingIntent.getActivity(context, id, intent, flags)

        val groupBuilder: NotificationCompat.Builder = NotificationCompat.Builder(
            context,
            Const.INCOMING_MESSAGES_CHANNEL_ID
        )
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(group)
            .setContentText("")
            .setStyle(
                NotificationCompat.InboxStyle()
                    .setSummaryText(group)
            )
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setGroupSummary(true)
            .setGroupAlertBehavior(NotificationCompat.GROUP_ALERT_CHILDREN)
            .setSilent(true)
            .setGroup(group)

        val notificationManager =
            NotificationManagerCompat.from(context.applicationContext)

        Log.i(TAG, "Posting group notification group=$group notificationId=$id")
        // TODO app crashes if user does not grant permission
        notificationManager.notify(id, groupBuilder.build())
    }

    private fun composeNotification(
        channelId: String,
        channelName: String,
        user: String,
        content: String,
        group: String
    ) {
        val id = channelId.hashCode()

        val intent = Intent(
            context,
            MainActivity::class.java
        )

        intent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP

        // Remove prefix from channel name before saving extras
        val address = channelId.substring(1)

        val bundle = Bundle()
        bundle.putString("channel", address)

        intent.putExtra("notification", bundle)

        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

        @SuppressLint("LaunchActivityFromNotification") val pendingIntent =
            PendingIntent.getActivity(context, id, intent, flags)

        // Display individual notification for each message
        @SuppressLint("LaunchActivityFromNotification") val builder: NotificationCompat.Builder =
            NotificationCompat.Builder(
                context,
                Const.INCOMING_MESSAGES_CHANNEL_ID
            )
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(channelName)
                .setContentText("$user: $content")
                .setGroup(group)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT) // Set the intent that will fire when the user taps the notification
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)

        // If message content is long enough, make it expandable
        if (content.length > 64) {
            builder.setStyle(NotificationCompat.BigTextStyle().bigText(content))
        }

        val notificationManager =
            NotificationManagerCompat.from(context.applicationContext)

        Log.i(
            TAG,
            "Posting message notification channelId=$channelId notificationId=$id channelName=$channelName",
        )
        // TODO app crashes if user does not grant permission
        notificationManager.notify(id, builder.build())
    }

    private fun logNotificationState(): Boolean {
        val notificationsEnabled = NotificationManagerCompat.from(context.applicationContext)
            .areNotificationsEnabled()
        val permissionGranted =
            Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                ContextCompat.checkSelfPermission(
                    context,
                    android.Manifest.permission.POST_NOTIFICATIONS,
                ) == PackageManager.PERMISSION_GRANTED

        Log.i(
            TAG,
            "notify called notificationsEnabled=$notificationsEnabled postPermissionGranted=$permissionGranted",
        )
        return notificationsEnabled && permissionGranted
    }

    companion object {
        private const val TAG = "NotificationHandler"
    }

}
