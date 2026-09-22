import React from 'react'
import { act, fireEvent } from '@testing-library/react-native'
import { DeviceEventEmitter, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
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
    const keyboardView = () =>
      screen
        .UNSAFE_getByType(KeyboardAvoidingView)
        .find(node => typeof node.type === 'string' && node.props.onLayout != null)
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
            screenY: show ? 510 : os === 'android' ? 844 - top : 844,
            width: 390,
            height: show ? 334 : 0,
          },
        })
      })
    }
    // A keyboard event can arrive before the first layout. There is no async native
    // measurement to leave KAV using an offset of zero (Pixel's measureInWindow result).
    await keyboard(true)
    await layout(844)
    await keyboard(false)
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
})
