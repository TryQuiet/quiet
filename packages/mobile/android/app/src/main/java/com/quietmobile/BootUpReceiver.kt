package com.quietmobile

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootUpReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val target = Intent(context, MainActivity::class.java)
        target.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(target)
    }
}