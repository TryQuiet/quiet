import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { FirebaseMessagingModule } = NativeModules;

class FirebaseMessaging {
  constructor() {
    if (Platform.OS === 'ios' && FirebaseMessagingModule) {
      this.eventEmitter = new NativeEventEmitter(FirebaseMessagingModule);
      this._setupListeners();
    }
  }

  _setupListeners() {
    // Listen for token received/refreshed events
    this.eventEmitter.addListener('fcmTokenReceived', (event) => {
      console.log('FCM Token received:', event.token);
      if (this._onTokenReceivedCallback) {
        this._onTokenReceivedCallback(event.token);
      }
    });

    this.eventEmitter.addListener('fcmTokenRefreshed', (event) => {
      console.log('FCM Token refreshed:', event.token);
      if (this._onTokenRefreshedCallback) {
        this._onTokenRefreshedCallback(event.token);
      }
    });
  }

  /**
   * Get the current FCM registration token
   * @returns {Promise<string>} The FCM token
   */
  async getToken() {
    if (Platform.OS !== 'ios') {
      throw new Error('Firebase Messaging is only implemented for iOS');
    }

    try {
      const token = await FirebaseMessagingModule.getToken();
      console.log('FCM Token retrieved:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      throw error;
    }
  }

  /**
   * Delete the current FCM registration token
   * @returns {Promise<void>}
   */
  async deleteToken() {
    if (Platform.OS !== 'ios') {
      throw new Error('Firebase Messaging is only implemented for iOS');
    }

    try {
      await FirebaseMessagingModule.deleteToken();
      console.log('FCM Token deleted');
    } catch (error) {
      console.error('Error deleting FCM token:', error);
      throw error;
    }
  }

  /**
   * Subscribe to a topic
   * @param {string} topic - The topic name
   * @returns {Promise<void>}
   */
  async subscribeToTopic(topic) {
    if (Platform.OS !== 'ios') {
      throw new Error('Firebase Messaging is only implemented for iOS');
    }

    try {
      await FirebaseMessagingModule.subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a topic
   * @param {string} topic - The topic name
   * @returns {Promise<void>}
   */
  async unsubscribeFromTopic(topic) {
    if (Platform.OS !== 'ios') {
      throw new Error('Firebase Messaging is only implemented for iOS');
    }

    try {
      await FirebaseMessagingModule.unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Set the encryption key for decrypting notifications
   * This key is stored in the Keychain and shared with the Notification Service Extension
   * @param {string} key - A 32-character (256-bit) encryption key
   */
  setEncryptionKey(key) {
    if (Platform.OS !== 'ios') {
      throw new Error('Firebase Messaging is only implemented for iOS');
    }

    if (!key || key.length !== 32) {
      console.warn('Encryption key should be exactly 32 characters (256 bits) for AES-256');
    }

    try {
      FirebaseMessagingModule.setEncryptionKey(key);
      console.log('Encryption key stored in Keychain');
    } catch (error) {
      console.error('Error setting encryption key:', error);
      throw error;
    }
  }

  /**
   * Listen for when a new token is received
   * @param {function} callback - Callback function that receives the token
   * @returns {function} Unsubscribe function
   */
  onTokenReceived(callback) {
    if (Platform.OS !== 'ios') {
      return () => {};
    }

    this._onTokenReceivedCallback = callback;
    return () => {
      this._onTokenReceivedCallback = null;
    };
  }

  /**
   * Listen for when the token is refreshed
   * @param {function} callback - Callback function that receives the new token
   * @returns {function} Unsubscribe function
   */
  onTokenRefreshed(callback) {
    if (Platform.OS !== 'ios') {
      return () => {};
    }

    this._onTokenRefreshedCallback = callback;
    return () => {
      this._onTokenRefreshedCallback = null;
    };
  }
}

export default new FirebaseMessaging();
