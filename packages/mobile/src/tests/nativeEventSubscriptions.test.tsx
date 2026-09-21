import React from 'react'
import { act, render } from '@testing-library/react-native'
import { DeviceEventEmitter, Keyboard, KeyboardAvoidingView, View } from 'react-native'
import nativeEventEmitter from '../store/nativeServices/events/nativeEventEmitter'

describe('Native event subscriptions', () => {
  it('delivers native bridge events until the subscription is removed', () => {
    const listener = jest.fn()
    const eventName = 'test-native-event-subscription'
    const subscription = nativeEventEmitter.addListener(eventName, listener)

    try {
      DeviceEventEmitter.emit(eventName, 'first message')
      expect(listener).toHaveBeenCalledWith('first message')

      subscription.remove()
      // Cleanup can run more than once; removal must remain safe.
      subscription.remove()
      DeviceEventEmitter.emit(eventName, 'after removal')
      expect(listener).toHaveBeenCalledTimes(1)
    } finally {
      subscription.remove()
    }
  })

  it('delivers keyboard events and removes KeyboardAvoidingView subscriptions on unmount', () => {
    const eventNames = ['keyboardWillShow', 'keyboardWillHide', 'keyboardDidShow', 'keyboardDidHide']
    // Initialize Keyboard before measuring: it retains its own visibility listeners.
    const listener = jest.fn()
    const subscription = Keyboard.addListener('keyboardDidShow', listener)
    const initialListenerCounts = eventNames.map(name => DeviceEventEmitter.listenerCount(name))
    const { unmount } = render(
      <KeyboardAvoidingView behavior='padding'>
        <View />
      </KeyboardAvoidingView>
    )
    const keyboardEvent = {
      duration: 0,
      easing: 'keyboard',
      endCoordinates: { screenX: 0, screenY: 500, width: 400, height: 300 },
    }

    try {
      act(() => DeviceEventEmitter.emit('keyboardDidShow', keyboardEvent))
      expect(listener).toHaveBeenCalledWith(keyboardEvent)

      unmount()
      expect(eventNames.map(name => DeviceEventEmitter.listenerCount(name))).toEqual(initialListenerCounts)

      subscription.remove()
      act(() => DeviceEventEmitter.emit('keyboardDidShow', keyboardEvent))
      expect(listener).toHaveBeenCalledTimes(1)
    } finally {
      subscription.remove()
      DeviceEventEmitter.emit('keyboardDidHide')
    }
  })
})
