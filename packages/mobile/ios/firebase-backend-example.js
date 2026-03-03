/**
 * Firebase Cloud Messaging - Backend Implementation
 * 
 * This file demonstrates how to send encrypted notifications from your Node.js backend
 * to the iOS app using Firebase Admin SDK.
 * 
 * Installation:
 *   npm install firebase-admin
 * 
 * Setup:
 * 1. Download your Firebase service account key from Firebase Console
 *    (Project Settings > Service Accounts > Generate New Private Key)
 * 2. Place the JSON file in a secure location
 * 3. Initialize Firebase Admin SDK with the service account
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin SDK
// Replace with your actual service account key path
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/**
 * Encrypt notification payload using AES-256-CBC
 * This matches the decryption implementation in the iOS Notification Service Extension
 * 
 * @param {Object} payload - The notification payload to encrypt
 * @param {string} key - 32-character encryption key (256 bits)
 * @returns {string} Base64-encoded encrypted data with IV prepended
 */
function encryptPayload(payload, key) {
  // Ensure key is exactly 32 bytes for AES-256
  const keyBuffer = Buffer.alloc(32);
  Buffer.from(key, 'utf8').copy(keyBuffer);
  
  // Generate random 16-byte initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
  
  // Encrypt the JSON payload
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Prepend IV to encrypted data (IV is not secret)
  const encryptedBuffer = Buffer.from(encrypted, 'base64');
  const combined = Buffer.concat([iv, encryptedBuffer]);
  
  return combined.toString('base64');
}

/**
 * Send an encrypted notification to a specific device
 * 
 * @param {string} fcmToken - The FCM token of the target device
 * @param {Object} payload - The notification payload (will be encrypted)
 * @param {string} encryptionKey - The encryption key (must match the one in the app)
 * @returns {Promise<string>} Message ID from FCM
 */
async function sendEncryptedNotification(fcmToken, payload, encryptionKey) {
  // Encrypt the payload
  const encryptedPayload = encryptPayload(payload, encryptionKey);
  
  // Construct FCM message
  const message = {
    token: fcmToken,
    data: {
      encrypted_payload: encryptedPayload
    },
    apns: {
      payload: {
        aps: {
          // Required for Notification Service Extension to run
          'mutable-content': 1,
          // Generic alert shown before decryption (fallback)
          'alert': {
            'title': 'New Message',
            'body': 'You have a new encrypted message'
          },
          'sound': 'default',
          'badge': payload.badge || 1
        }
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent encrypted message:', response);
    return response;
  } catch (error) {
    console.error('Error sending encrypted message:', error);
    throw error;
  }
}

/**
 * Send an encrypted notification to a topic
 * 
 * @param {string} topic - The topic name
 * @param {Object} payload - The notification payload (will be encrypted)
 * @param {string} encryptionKey - The encryption key
 * @returns {Promise<string>} Message ID from FCM
 */
async function sendEncryptedNotificationToTopic(topic, payload, encryptionKey) {
  const encryptedPayload = encryptPayload(payload, encryptionKey);
  
  const message = {
    topic: topic,
    data: {
      encrypted_payload: encryptedPayload
    },
    apns: {
      payload: {
        aps: {
          'mutable-content': 1,
          'alert': {
            'title': 'New Message',
            'body': 'You have a new encrypted message'
          },
          'sound': 'default',
          'badge': payload.badge || 1
        }
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent encrypted message to topic:', response);
    return response;
  } catch (error) {
    console.error('Error sending encrypted message to topic:', error);
    throw error;
  }
}

// Example usage
async function exampleUsage() {
  // Your encryption key (must be 32 characters for AES-256)
  // This should be securely generated and stored
  // The same key must be set in the iOS app using FirebaseMessaging.setEncryptionKey()
  const encryptionKey = 'your-32-character-secret-key!!';
  
  // The notification payload to encrypt
  const payload = {
    title: 'Secure Message',
    body: 'This is an encrypted notification from the backend!',
    badge: 1,
    sound: 'default',
    // You can add custom data
    customData: {
      messageId: '12345',
      senderId: 'user123',
      channelId: 'channel456'
    }
  };
  
  // FCM token from the iOS device
  const fcmToken = 'device-fcm-token-here';
  
  try {
    // Send to specific device
    await sendEncryptedNotification(fcmToken, payload, encryptionKey);
    
    // Or send to a topic
    await sendEncryptedNotificationToTopic('general', payload, encryptionKey);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

module.exports = {
  encryptPayload,
  sendEncryptedNotification,
  sendEncryptedNotificationToTopic
};
