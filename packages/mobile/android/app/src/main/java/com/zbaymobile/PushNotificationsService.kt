package com.zbaymobile

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig


class PushNotificationsService: HeadlessJsTaskService() {

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig {
        val extras = intent!!.extras
        return HeadlessJsTaskConfig(
            "pushNotifications",
            Arguments.fromBundle(extras),
            0,
            true
        )
    }

}
