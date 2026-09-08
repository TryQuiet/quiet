import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Modal, StyleSheet, Text } from 'react-native'
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { SafeAreaModal } from './SafeAreaModal.component'

// Exercise the real provider and native-view configuration instead of the global
// zero-inset mock. Jest supplies native events; actual pixel layout needs a device.
jest.unmock('react-native-safe-area-context')

const activityMetrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 24, bottom: 24, left: 0, right: 0 },
}

const InsetsProbe = ({ testID }: { testID: string }) => (
  <Text testID={testID}>{JSON.stringify(useSafeAreaInsets())}</Text>
)

const modalNativeProvider = () =>
  screen
    .UNSAFE_getByType(Modal)
    .findByType(SafeAreaProvider)
    .find(node => typeof node.props.onInsetsChange === 'function')

describe('SafeAreaModal', () => {
  it('updates all modal insets independently of the activity, including after rotation', () => {
    render(
      <SafeAreaProvider initialMetrics={activityMetrics}>
        <InsetsProbe testID='activity-insets' />
        <SafeAreaModal visible>
          <InsetsProbe testID='modal-insets' />
        </SafeAreaModal>
      </SafeAreaProvider>
    )

    const portraitInsets = { top: 48, bottom: 32, left: 6, right: 9 }
    fireEvent(modalNativeProvider(), 'insetsChange', {
      nativeEvent: { frame: activityMetrics.frame, insets: portraitInsets },
    })

    expect(screen.getByTestId('modal-insets')).toHaveTextContent(JSON.stringify(portraitInsets))
    expect(screen.getByTestId('activity-insets')).toHaveTextContent(JSON.stringify(activityMetrics.insets))

    // Inspect the real SafeAreaView's native props: padding must protect every edge.
    const nativeSafeAreaView = screen.UNSAFE_getByType(SafeAreaView).find(node => node.props.edges !== undefined)
    expect(nativeSafeAreaView.props.edges).toEqual({
      top: 'additive',
      bottom: 'additive',
      left: 'additive',
      right: 'additive',
    })

    const landscapeInsets = { top: 0, bottom: 24, left: 48, right: 0 }
    fireEvent(modalNativeProvider(), 'insetsChange', {
      nativeEvent: { frame: { x: 0, y: 0, width: 800, height: 360 }, insets: landscapeInsets },
    })

    expect(screen.getByTestId('modal-insets')).toHaveTextContent(JSON.stringify(landscapeInsets))
    expect(screen.getByTestId('activity-insets')).toHaveTextContent(JSON.stringify(activityMetrics.insets))
  })

  it('does not retain activity insets when the modal window already fits inside system bars', () => {
    render(
      <SafeAreaProvider initialMetrics={activityMetrics}>
        <SafeAreaModal visible>
          <InsetsProbe testID='modal-insets' />
        </SafeAreaModal>
      </SafeAreaProvider>
    )

    const fittedInsets = { top: 0, bottom: 0, left: 0, right: 0 }
    fireEvent(modalNativeProvider(), 'insetsChange', {
      nativeEvent: {
        frame: { x: 0, y: 24, width: 360, height: 752 },
        insets: fittedInsets,
      },
    })

    expect(screen.getByTestId('modal-insets')).toHaveTextContent(JSON.stringify(fittedInsets))
    expect(StyleSheet.flatten(screen.UNSAFE_getByType(SafeAreaView).props.style)).toEqual({ flex: 1 })
  })

  it('preserves content styling, modal options, and the native close callback', () => {
    const onRequestClose = jest.fn()
    const contentStyle = { backgroundColor: 'white', padding: 8 }

    render(
      <SafeAreaProvider initialMetrics={activityMetrics}>
        <SafeAreaModal visible animationType='slide' contentStyle={contentStyle} onRequestClose={onRequestClose}>
          <Text>Image preview</Text>
        </SafeAreaModal>
      </SafeAreaProvider>
    )

    expect(screen.getByText('Image preview')).toBeVisible()
    expect(StyleSheet.flatten(screen.UNSAFE_getByType(SafeAreaView).props.style)).toEqual({
      flex: 1,
      ...contentStyle,
    })

    const modal = screen.UNSAFE_getByType(Modal)
    expect(modal.props.animationType).toBe('slide')
    expect(modal.props.visible).toBe(true)
    fireEvent(modal, 'requestClose')
    expect(onRequestClose).toHaveBeenCalledTimes(1)
  })
})
