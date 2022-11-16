package com.zbaymobile.Notification

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.zbaymobile.R
import com.zbaymobile.Utils.Const
import org.json.JSONException
import org.json.JSONObject
import java.util.concurrent.ThreadLocalRandom

class NotificationHandler(private val context: Context) {

    /**
     * @param message - Object of type ChannelMessage
     */
    fun notify(message: String?, username: String?) {
        var channel = ""
        var content = ""

        val _message: JSONObject = try {
            JSONObject(message)
        } catch (e: JSONException) {
            Log.e("NOTIFICATION", "unexpected JSON exception", e)
            return
        }

        // Parse user name
        val user = String.format("@%s", username)

        try {
            // Parse channel name
            val _channel = _message.getString("channelAddress")
            channel = String.format("#%s", _channel)
            // Parse message content
            val _content = _message.getString("message")
            content = String.format("%s", _content)
        } catch (e: JSONException) {
            Log.e("NOTIFICATION", "incorrect NOTIFICATION payload", e)
            return
        }

        composeNotification(channel, user, content)
    }

    private fun composeNotification(channel: String, user: String, content: String) {
        val id_message = ThreadLocalRandom.current().nextInt(0, 9000 + 1)
        val id_group = channel.hashCode()

        // Group messages per channel
        val groupBuilder: NotificationCompat.Builder = NotificationCompat.Builder(
            context,
            Const.INCOMING_MESSAGES_CHANNEL_ID
        )
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(channel)
            .setContentText("")
            .setStyle(
                NotificationCompat.InboxStyle()
                    .setSummaryText(channel)
            )
            .setAutoCancel(true)
            .setGroupSummary(true)
            .setGroup(channel)

        val intent = Intent(
            context,
            NotificationReceiver::class.java
        )

        intent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP

        // Remove prefix from channel name before saving extras
        val extra = channel.substring(1)
        intent.putExtra("channel", extra)

        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

        @SuppressLint("LaunchActivityFromNotification") val pendingIntent =
            PendingIntent.getBroadcast(context, id_message, intent, flags)

        // Display individual notification for each message
        @SuppressLint("LaunchActivityFromNotification") val builder: NotificationCompat.Builder =
            NotificationCompat.Builder(
                context,
                Const.INCOMING_MESSAGES_CHANNEL_ID
            )
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(user)
                .setContentText(content)
                .setGroup(channel)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT) // Set the intent that will fire when the user taps the notification
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)

        // If message content is long enough, make it expandable
        if (content.length > 64) {
            builder.setStyle(NotificationCompat.BigTextStyle().bigText(content))
        }
        val notificationManager =
            NotificationManagerCompat.from(context.applicationContext)

        notificationManager.notify(id_group, groupBuilder.build())
        notificationManager.notify(id_message, builder.build())
    }

}
