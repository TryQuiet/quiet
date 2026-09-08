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
        try {
            FirebaseMessaging.getInstance().token
                .addOnSuccessListener { token -> promise.resolve(token) }
                .addOnFailureListener { error ->
                    promise.reject("token_error", "Failed to get FCM token: ${error.localizedMessage}", error)
                }
        } catch (error: Throwable) {
            // FirebaseMessaging.getInstance() throws synchronously (e.g. IllegalStateException
            // "Default FirebaseApp is not initialized") when the build has no google-services.json.
            // Reject the promise instead of letting the exception crash the app.
            promise.reject("token_error", "Firebase is not available: ${error.localizedMessage}", error)
        }
    }

    @ReactMethod
    fun deleteToken(promise: Promise) {
        try {
            FirebaseMessaging.getInstance().deleteToken()
                .addOnSuccessListener { promise.resolve(null) }
                .addOnFailureListener { error ->
                    promise.reject("delete_error", "Failed to delete FCM token: ${error.localizedMessage}", error)
                }
        } catch (error: Throwable) {
            // See getToken(): getInstance() can throw before any listener is attached.
            promise.reject("delete_error", "Firebase is not available: ${error.localizedMessage}", error)
        }
    }
}
