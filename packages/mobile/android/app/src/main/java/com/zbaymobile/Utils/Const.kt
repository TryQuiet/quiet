package com.zbaymobile.Utils

import com.zbaymobile.MainApplication.PACKAGE_NAME

object Const {

    const val NOTIFICATION_CHANNEL_ID = "zbay_channel"
    const val NOTIFICATION_FOREGROUND_SERVICE_ID = 1

    const val TAG_NOTICE="NOTICE"
    const val TAG_TOR = "TOR"
    const val TAG_TOR_ERR = " TOR_ERR"

    val SERVICE_ACTION_EXECUTE = "$PACKAGE_NAME.service.execute"
    val SERVICE_ACTION_STOP = "$PACKAGE_NAME.service.stop"
}
