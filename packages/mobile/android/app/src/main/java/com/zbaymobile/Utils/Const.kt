package com.zbaymobile.Utils

import com.zbaymobile.MainApplication.PACKAGE_NAME

object Const {

    const val SHARED_PREFERENCES = "com.zbaymobile.preferences"

    const val NOTIFICATION_CHANNEL_ID = "zbay_channel"
    const val NOTIFICATION_FOREGROUND_SERVICE_ID = 1

    const val TAG_NOTICE="NOTICE"
    const val TAG_NODE ="NODE"
    const val TAG_TOR = "TOR"

    const val DEFAULT_SOCKS_PORT = 9050
    const val DEFAULT_CONTROL_PORT = 9151

    val SERVICE_ACTION_EXECUTE = "$PACKAGE_NAME.service.execute"
    val SERVICE_ACTION_STOP = "$PACKAGE_NAME.service.stop"
}
