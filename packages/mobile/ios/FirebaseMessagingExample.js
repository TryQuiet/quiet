/**
 * Firebase Messaging Integration Example
 * 
 * This file shows how to integrate Firebase Cloud Messaging with encrypted notifications
 * into your React Native app.
 * 
 * Usage:
 * 1. Import this hook in your main App component
 * 2. Call useFirebaseMessaging() in your component
 * 3. Implement sendTokenToBackend() to send tokens to your server
 */

import { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import FirebaseMessaging from './FirebaseMessaging';

/**
 * Custom hook to manage Firebase Cloud Messaging
 * @param {string} encryptionKey - 32-character encryption key (should come from secure source)
 * @returns {Object} FCM token and loading state
 */
export function useFirebaseMessaging(encryptionKey) {
  const [fcmToken, setFcmToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setLoading(false);
      return;
    }

    let tokenReceivedUnsubscribe;
    let tokenRefreshedUnsubscribe;

    const initializeFirebase = async () => {
      try {
        // Validate encryption key
        if (!encryptionKey || encryptionKey.length !== 32) {
          throw new Error('Encryption key must be exactly 32 characters');
        }

        // Set encryption key for notification decryption
        FirebaseMessaging.setEncryptionKey(encryptionKey);
        console.log('✅ Encryption key set');

        // Get FCM token
        const token = await FirebaseMessaging.getToken();
        setFcmToken(token);
        console.log('✅ FCM Token retrieved:', token);

        // Send token to backend
        await sendTokenToBackend(token);

        // Optional: Subscribe to topics
        // await FirebaseMessaging.subscribeToTopic('general');
        // console.log('✅ Subscribed to topic: general');

        setLoading(false);
      } catch (err) {
        console.error('❌ Error initializing Firebase Messaging:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    // Listen for token events
    tokenReceivedUnsubscribe = FirebaseMessaging.onTokenReceived(async (token) => {
      console.log('🔔 FCM Token received:', token);
      setFcmToken(token);
      await sendTokenToBackend(token);
    });

    tokenRefreshedUnsubscribe = FirebaseMessaging.onTokenRefreshed(async (token) => {
      console.log('🔄 FCM Token refreshed:', token);
      setFcmToken(token);
      await sendTokenToBackend(token);
    });

    // Initialize
    initializeFirebase();

    // Cleanup
    return () => {
      if (tokenReceivedUnsubscribe) tokenReceivedUnsubscribe();
      if (tokenRefreshedUnsubscribe) tokenRefreshedUnsubscribe();
    };
  }, [encryptionKey]);

  return { fcmToken, loading, error };
}

/**
 * Send FCM token to your backend server
 * Implement this function to match your backend API
 * 
 * @param {string} token - FCM token
 */
async function sendTokenToBackend(token) {
  try {
    // Example: Send to your backend via existing websocket or HTTP
    // Replace this with your actual implementation
    
    // Option 1: Via WebSocket (if using your existing socket connection)
    // WebsocketSingleton.send({ type: 'FCM_TOKEN', token });
    
    // Option 2: Via HTTP API
    // const response = await fetch('https://your-backend.com/api/fcm-token', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token })
    // });
    
    console.log('📤 Token sent to backend:', token);
  } catch (error) {
    console.error('❌ Error sending token to backend:', error);
  }
}

/**
 * Example: Complete App component with Firebase integration
 */
export function AppWithFirebase() {
  // In production, this key should come from your backend after authentication
  // For example, after user logs in, backend sends a unique encryption key
  const [encryptionKey, setEncryptionKey] = useState(null);
  
  // Initialize Firebase after getting encryption key
  const { fcmToken, loading, error } = useFirebaseMessaging(encryptionKey);

  useEffect(() => {
    // Simulate getting encryption key from backend after authentication
    // In real app, this would happen after successful login
    const initializeEncryption = async () => {
      try {
        // Example: Get encryption key from backend
        // const response = await fetch('https://your-backend.com/api/encryption-key');
        // const { key } = await response.json();
        
        // For demo purposes, using a static key
        // ⚠️ DON'T DO THIS IN PRODUCTION!
        const key = 'your-32-character-secret-key!!';
        setEncryptionKey(key);
      } catch (err) {
        console.error('Failed to get encryption key:', err);
      }
    };

    initializeEncryption();
  }, []);

  if (loading) {
    return null; // Or your loading component
  }

  if (error) {
    console.error('Firebase error:', error);
  }

  return (
    // Your app component
    <YourAppComponent fcmToken={fcmToken} />
  );
}

/**
 * Utility: Request notification permissions
 * Call this before initializing Firebase
 */
export async function requestNotificationPermissions() {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      resolve(false);
      return;
    }

    const { CommunicationModule } = require('react-native').NativeModules;
    
    // Listen for permission result
    const eventEmitter = new (require('react-native').NativeEventEmitter)(CommunicationModule);
    const subscription = eventEmitter.addListener('notificationPermissionResult', (result) => {
      subscription.remove();
      resolve(result.granted);
    });

    // Request permission
    CommunicationModule.requestNotificationPermission();
  });
}

/**
 * Example: Full initialization flow
 */
export async function initializeNotifications() {
  try {
    // Step 1: Request notification permissions
    const granted = await requestNotificationPermissions();
    
    if (!granted) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in Settings to receive messages.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    console.log('✅ Notification permissions granted');

    // Step 2: Get encryption key from backend
    const encryptionKey = await getEncryptionKeyFromBackend();

    // Step 3: Initialize Firebase with encryption key
    FirebaseMessaging.setEncryptionKey(encryptionKey);

    // Step 4: Get and send FCM token
    const token = await FirebaseMessaging.getToken();
    await sendTokenToBackend(token);

    console.log('✅ Notifications initialized successfully');
    return token;
  } catch (error) {
    console.error('❌ Failed to initialize notifications:', error);
    throw error;
  }
}

/**
 * Get encryption key from your backend
 * Implement this based on your authentication flow
 */
async function getEncryptionKeyFromBackend() {
  // Example implementation
  // Replace with your actual backend call
  
  try {
    // Option 1: Get from REST API
    // const response = await fetch('https://your-backend.com/api/user/encryption-key', {
    //   headers: {
    //     'Authorization': `Bearer ${userToken}`
    //   }
    // });
    // const { encryptionKey } = await response.json();
    // return encryptionKey;

    // Option 2: Generate based on user credentials
    // const key = await generateEncryptionKey(userId, userSecret);
    // return key;

    // For demo purposes only - DON'T USE IN PRODUCTION
    return 'your-32-character-secret-key!!';
  } catch (error) {
    console.error('Failed to get encryption key:', error);
    throw error;
  }
}

/**
 * Example: Topic subscription management
 */
export async function subscribeToChannels(channelIds) {
  try {
    for (const channelId of channelIds) {
      await FirebaseMessaging.subscribeToTopic(channelId);
      console.log(`✅ Subscribed to channel: ${channelId}`);
    }
  } catch (error) {
    console.error('Failed to subscribe to channels:', error);
  }
}

export async function unsubscribeFromChannels(channelIds) {
  try {
    for (const channelId of channelIds) {
      await FirebaseMessaging.unsubscribeFromTopic(channelId);
      console.log(`✅ Unsubscribed from channel: ${channelId}`);
    }
  } catch (error) {
    console.error('Failed to unsubscribe from channels:', error);
  }
}

/**
 * Example: Logout - clean up Firebase token
 */
export async function cleanupOnLogout() {
  try {
    // Delete FCM token
    await FirebaseMessaging.deleteToken();
    console.log('✅ FCM token deleted');

    // Optionally, notify backend to remove token
    await notifyBackendTokenDeleted();
  } catch (error) {
    console.error('Failed to cleanup Firebase on logout:', error);
  }
}

async function notifyBackendTokenDeleted() {
  // Implement based on your backend API
  // await fetch('https://your-backend.com/api/fcm-token', { method: 'DELETE' });
}
