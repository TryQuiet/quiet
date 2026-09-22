import React from 'react'
import { act, fireEvent } from '@testing-library/react-native'
import { DeviceEventEmitter, Platform, StyleSheet } from 'react-native'
import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { Chat } from '../Chat.component'
import UploadFilesPreviewsComponent from '../../FileAttachmentPreview/FileAttachmentPreview.component'
import { ChatProps } from '../Chat.types'
import { FileActionsProps } from '../../FileAttachment/FileAttachment.types'
import { ChannelType } from '@quiet/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: jest.fn() }))

const dmProps = (channelName: string): ChatProps & FileActionsProps =>
  ({
    contextMenu: {
      visible: false,
      handleOpen: jest.fn(),
      handleClose: jest.fn(),
    },
    sendMessageAction: jest.fn(),
    loadMessagesAction: jest.fn(),
    handleBackButton: jest.fn(),
    openImagePreview: jest.fn(),
    duplicatedUsernameHandleBack: jest.fn(),
    unregisteredUsernameHandleBack: jest.fn(),
    createOrSetDmChannelAction: jest.fn(),
    setDmChannelOnSelection: jest.fn(),
    openUrl: jest.fn(),
    downloadFile: jest.fn(),
    cancelDownload: jest.fn(),
    updateFileAttachments: jest.fn(),
    updateImageAttachments: jest.fn(),
    removeFilePreview: jest.fn(),
    channel: {
      name: 'Direct message',
      description: 'Direct message',
      owner: 'me',
      timestamp: 0,
      id: 'dm_0000000000000000000000000000000000000000000000000000000000000000',
      public: false,
      teamId: 'foobar',
      type: ChannelType.DM,
      memberIds: ['me', 'them'],
    },
    channelName,
    newChat: false,
    userProfiles: {},
    isUserConnected: () => false,
    isTorInitialized: true,
    pendingMessages: {},
    uploadedFiles: {},
    messages: { count: 0, groups: {} },
  } as unknown as ChatProps & FileActionsProps)

// Exercise RN's real KeyboardAvoidingView, including layout and native-event subscriptions.
// Bounds include the safe area already reserved by App.
//
// The keyboard event's two numbers are not independent, and the fixtures below keep the
// relationship a device actually reports (measured on an Android 16 emulator, 1080x2400 at 420dpi,
// gesture navigation): React Native takes `height` from the IME inset minus the system bars, and
// `screenY` from the visible display frame, so with the keyboard up
//
//     screenY = screenHeight - imeInset       and       height = imeInset - bottomInset
//
// which makes `height` exactly the lift a view whose bottom sits at `screenHeight - bottomInset`
// needs. `SCREEN` is the screen's height and `bottom` the navigation bar's inset, which App has
// already reserved around the navigator.
const SCREEN = 844

describe('Chat keyboard geometry', () => {
  const originalOS = Platform.OS
  afterEach(() => {
    Platform.OS = originalOS
    jest.restoreAllMocks()
  })

  it.each([
    { os: 'ios', top: 62, bottom: 34, resized: false },
    { os: 'ios', top: 20, bottom: 0, resized: false },
    { os: 'android', top: 172 / 2.625, bottom: 24, resized: false },
    { os: 'android', top: 24, bottom: 0, resized: true },
  ] as const)('avoids only remaining keyboard overlap: %j', async ({ os, top, bottom, resized }) => {
    Platform.OS = os
    jest.mocked(useSafeAreaInsets).mockReturnValue({ top, bottom, left: 0, right: 0 })
    const screen = renderComponent(<Chat {...dmProps('Geometry fixture')} />)
    const keyboardView = () => screen.getByTestId('chat-keyboard-avoidance')
    const layout = async (windowBottom: number) => {
      await act(async () => {
        fireEvent(keyboardView(), 'layout', {
          persist: jest.fn(),
          nativeEvent: { layout: { x: 0, y: 56, width: 390, height: windowBottom - top - bottom - 56 } },
        })
      })
    }
    const keyboard = async (show: boolean) => {
      await act(async () => {
        DeviceEventEmitter.emit(`keyboard${os === 'ios' ? 'Will' : 'Did'}${show ? 'Show' : 'Hide'}`, {
          duration: 0,
          easing: 'keyboard',
          endCoordinates: {
            screenX: 0,
            screenY: show ? 510 : os === 'android' ? SCREEN - top : SCREEN,
            width: 390,
            // imeInset is SCREEN - screenY, and the event reports it net of the navigation bar.
            height: show ? SCREEN - 510 - bottom : 0,
          },
        })
      })
    }
    // A keyboard event can arrive before the first layout, and nothing may be measured yet when it
    // does. Then the keyboard closes and the composer is laid out with nothing covering it, which
    // is how it learns the height it has to itself — what tells a window that resizes for the
    // keyboard apart from one that does not.
    await keyboard(true)
    await layout(844)
    await keyboard(false)
    await layout(844)
    expect(keyboardView()).toHaveStyle({ paddingBottom: 0 })
    for (let cycle = 0; cycle < 2; cycle++) {
      await keyboard(true)
      if (resized) await layout(510)
      const overlap = resized ? 0 : 844 - bottom - 510
      expect(keyboardView()).toHaveStyle({ paddingBottom: overlap })
      const padding = StyleSheet.flatten(keyboardView().props.style).paddingBottom
      const composerBottom = (resized ? 510 : 844) - bottom - padding
      expect(composerBottom).toBeCloseTo(510)
      const toolbar = StyleSheet.flatten(screen.getByTestId('chat-composer-toolbar').props.style)
      const sendTargetBottom = composerBottom - toolbar.paddingVertical
      expect(sendTargetBottom).toBeLessThanOrEqual(510 - 8)
      expect(screen.getByTestId('chat-composer-controls')).not.toHaveStyle({ paddingBottom: 20 })
      expect(screen.getByTestId('chat-composer-toolbar')).toHaveStyle({ paddingVertical: 8 })
      // An empty attachment strip otherwise contributes another 15pt below the toolbar.
      expect(screen.UNSAFE_queryByType(UploadFilesPreviewsComponent)).toBeNull()
      fireEvent(screen.getByTestId('input'), 'contentSizeChange', {
        nativeEvent: { contentSize: { width: 358, height: 100 } },
      })
      fireEvent.changeText(screen.getByTestId('input'), 'One\nTwo\nThree\nFour\nFive')
      expect(keyboardView()).toHaveStyle({ paddingBottom: overlap })
      expect(screen.getByTestId('send_message_button')).toBeTruthy()
      await keyboard(false)
      await layout(844)
      expect(keyboardView()).toHaveStyle({ paddingBottom: 0 })
      expect(screen.getByTestId('chat-composer-controls')).not.toHaveStyle({ paddingBottom: 20 })
    }
    screen.unmount()
  })

  /**
   * Android 15+ lays every window out edge to edge and stops honouring `adjustResize`, so the
   * visible display frame need not shrink for the keyboard. `screenY` then comes back at the bottom
   * of the window with the keyboard already up, and an overlap measured from it reads as nothing —
   * which left the send and attach controls under the keyboard on a Pixel 10 Pro.
   *
   * The keyboard's own height still arrives correctly, because React Native reads it from
   * `WindowInsets.Type.ime()`, and that is what the composer now avoids.
   */
  it('still clears the keyboard when an edge-to-edge window does not shrink', async () => {
    Platform.OS = 'android'
    const top = 172 / 2.625
    const bottom = 24
    const keyboardHeight = 310
    jest.mocked(useSafeAreaInsets).mockReturnValue({ top, bottom, left: 0, right: 0 })
    const screen = renderComponent(<Chat {...dmProps('Edge to edge fixture')} />)
    const keyboardView = () => screen.getByTestId('chat-keyboard-avoidance')
    const layout = async () => {
      await act(async () => {
        fireEvent(keyboardView(), 'layout', {
          persist: jest.fn(),
          nativeEvent: { layout: { x: 0, y: 56, width: 390, height: SCREEN - top - bottom - 56 } },
        })
      })
    }

    await layout()
    await act(async () => {
      DeviceEventEmitter.emit('keyboardDidShow', {
        duration: 0,
        easing: 'keyboard',
        endCoordinates: {
          screenX: 0,
          // The window did not resize, so the visible frame still ends where the window does.
          screenY: SCREEN - bottom,
          width: 390,
          height: keyboardHeight,
        },
      })
    })
    // Nothing relayouts, because nothing about the window changed.
    await layout()

    expect(keyboardView()).toHaveStyle({ paddingBottom: keyboardHeight })
    const composerBottom = SCREEN - bottom - keyboardHeight
    expect(composerBottom).toBeCloseTo(SCREEN - bottom - keyboardHeight)
    const toolbar = StyleSheet.flatten(screen.getByTestId('chat-composer-toolbar').props.style)
    expect(composerBottom - toolbar.paddingVertical).toBeLessThanOrEqual(SCREEN - bottom - keyboardHeight)

    await act(async () => {
      DeviceEventEmitter.emit('keyboardDidHide', {
        duration: 0,
        easing: 'keyboard',
        endCoordinates: { screenX: 0, screenY: SCREEN - top, width: 390, height: 0 },
      })
    })
    expect(keyboardView()).toHaveStyle({ paddingBottom: 0 })
    screen.unmount()
  })
})
