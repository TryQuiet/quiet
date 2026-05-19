package com.quietmobile.Push

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.firebase.messaging.FirebaseMessaging

class FirebaseMessagingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "FirebaseMessagingModule"

    @ReactMethod
    fun getToken(promise: Promise) {
        FirebaseMessaging.getInstance().token
            .addOnSuccessListener { token -> promise.resolve(token) }
            .addOnFailureListener { error ->
                promise.reject("token_error", "Failed to get FCM token: ${error.localizedMessage}", error)
            }
    }

    @ReactMethod
    fun deleteToken(promise: Promise) {
        FirebaseMessaging.getInstance().deleteToken()
            .addOnSuccessListener { promise.resolve(null) }
            .addOnFailureListener { error ->
                promise.reject("delete_error", "Failed to delete FCM token: ${error.localizedMessage}", error)
            }
    }
}
