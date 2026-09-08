import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import { ChannelComponent } from './ChannelComponent'
import { renderComponent } from '../../testUtils/renderComponent'
import { ModalName } from '../../sagas/modals/modals.types'

describe('ChannelComponent', () => {
  const renderChannel = (overrides: Partial<React.ComponentProps<typeof ChannelComponent>> = {}) => {
    window.HTMLElement.prototype.scrollTo = jest.fn()
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))

    const props: React.ComponentProps<typeof ChannelComponent> = {
      user: {
        userId: 'userId',
        nickname: 'alice',
      },
      channelId: 'general-channel-id',
      channelName: 'general',
      isPublic: true,
      messages: {
        count: 0,
        groups: {},
      },
      newestMessage: {
        id: 'newest-message-id',
        type: 1,
        message: 'newest message',
        createdAt: 1,
        channelId: 'general-channel-id',
        userId: 'userId',
      },
      pendingMessages: {},
      maxAutodownloadSizeBytes: 0,
      lazyLoading: jest.fn(),
      onInputChange: jest.fn(),
      onInputEnter: jest.fn(),
      openUrl: jest.fn(),
      openFilesDialog: jest.fn(),
      handleFileDrop: jest.fn(),
      isCommunityInitialized: true,
      currentChannelSubscribed: true,
      handleClipboardFiles: jest.fn(),
      pendingGeneralChannelRecreation: false,
      unregisteredUsernameModalHandleOpen: () => ({
        type: 'Modals/openModal',
        payload: {
          name: ModalName.unregisteredUsernameModal,
        },
      }),
      duplicatedUsernameModalHandleOpen: () => ({
        type: 'Modals/openModal',
        payload: {
          name: ModalName.duplicatedUsernameModal,
        },
      }),
      filesData: {},
      removeFile: jest.fn(),
      ...overrides,
    }

    return renderComponent(<ChannelComponent {...props} />)
  }

  it('enables input for an initialized subscribed channel with zero messages', () => {
    renderChannel()

    expect(screen.getByTestId('messageInput')).toBeEnabled()
  })

  it('disables input for an initialized unsubscribed channel with zero messages', () => {
    renderChannel({ currentChannelSubscribed: false })

    expect(screen.getByTestId('messageInput')).toBeDisabled()
  })
})
