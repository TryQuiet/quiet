package com.zbaymobile

import android.content.Context
import android.content.SharedPreferences
import com.zbaymobile.Scheme.Onion
import com.zbaymobile.Utils.Const.DEFAULT_CONTROL_PORT
import com.zbaymobile.Utils.Const.DEFAULT_SOCKS_PORT
import com.zbaymobile.Utils.Const.SHARED_PREFERENCES


class Prefs(val context: Context) {

    private val SOCKS_PORT = "socks.port"
    private val CONTROL_PORT = "control.port"
    private val ONION_PRIV_KEY = "onion.priv.key"

    private val preferences = getSharedPrefs(context)

    private fun getSharedPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(
            SHARED_PREFERENCES,
            Context.MODE_PRIVATE
        )
    }

    var socksPort: Int
        get() = preferences.getInt(SOCKS_PORT, DEFAULT_SOCKS_PORT)
        set(value) = preferences.edit().putInt(SOCKS_PORT, value).apply()

    var controlPort: Int
        get() = preferences.getInt(CONTROL_PORT, DEFAULT_CONTROL_PORT)
        set(value) = preferences.edit().putInt(CONTROL_PORT, value).apply()

    var onionPrivKey: String?
        get() = preferences.getString(ONION_PRIV_KEY, "NEW:BEST")
        set(value) = preferences.edit().putString(ONION_PRIV_KEY, value).apply()

}
