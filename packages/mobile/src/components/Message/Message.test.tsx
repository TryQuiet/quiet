import React from 'react'
import { act, fireEvent, screen } from '@testing-library/react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { DisplayableMessage, MessageType } from '@quiet/types'
import { DEFAULT_AUTODOWNLOAD_SIZE_LIMIT } from '@quiet/state-manager'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Message } from './Message.component'

const LINK_HREF = 'https://tryquiet.org'

// src/setupTests.tsx replaces the markdown renderer with `<div>{children}</div>`, which never
// calls the `rules` the component passes it. That would leave the `link` rule - the one place
// where a long press has to beat an existing onPress - completely uncovered. This stand-in
// keeps the setupTests behaviour and additionally renders what the component's own `link` rule
// returns, so the real rule is exercised.
jest.mock('@ronradtke/react-native-markdown-display', () => {
  const react = require('react')
  const href = 'https://tryquiet.org'
  return {
    __esModule: true,
    default: ({ children, rules }: any) =>
      react.createElement(
        'div',
        null,
        children,
        // Stands in for linkify: when the markdown source contains the url, render whatever the
        // component's own `link` rule returns for it.
        typeof children === 'string' && children.includes(href)
          ? rules.link({ key: 'link', attributes: { href } }, [href], [], { link: {} })
          : null
      ),
    MarkdownIt: jest.fn(),
    hasParents: jest.fn(),
  }
})

// Clipboard itself is mocked globally in src/setupTests.tsx, next to the other native modules.
const setString = Clipboard.setString as jest.Mock

const basicMessage: DisplayableMessage = {
  id: 'message-id',
  type: MessageType.Basic,
  // Deliberately markdown: we copy the source the author typed, not the rendered text.
  message: `Hello **world**, see ${LINK_HREF}`,
  createdAt: 1698483600,
  date: '28 Oct, 10:00',
  nickname: 'alice',
  userId: 'aliceUserId',
  isDuplicated: false,
  isRegistered: true,
}

const imageMessage: DisplayableMessage = {
  ...basicMessage,
  id: 'image-message-id',
  type: MessageType.Image,
  message: 'image.png',
  media: {
    cid: 'cid',
    path: '/mnt/storage/image.png',
    name: 'image',
    ext: '.png',
    message: { id: 'image-message-id', channelId: 'channel-id' },
    width: 100,
    height: 100,
    size: 1024,
  },
}

const renderMessage = (data: DisplayableMessage[], openUrl: jest.Mock = jest.fn()) => {
  renderComponent(
    <Message
      data={data}
      maxAutodownloadSizeBytes={DEFAULT_AUTODOWNLOAD_SIZE_LIMIT}
      openUrl={openUrl}
      openImagePreview={jest.fn()}
      downloadFile={jest.fn()}
      cancelDownload={jest.fn()}
      duplicatedUsernameHandleBack={jest.fn()}
      unregisteredUsernameHandleBack={jest.fn()}
    />
  )
  return { openUrl }
}

describe('Message component - copy on long press', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    setString.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('copies the raw message text to the clipboard on long press', () => {
    renderMessage([basicMessage])

    fireEvent(screen.getByTestId(`message-copy-${basicMessage.id}`), 'longPress')

    expect(setString).toHaveBeenCalledTimes(1)
    expect(setString).toHaveBeenCalledWith(`Hello **world**, see ${LINK_HREF}`)
  })

  it('shows a "Copied" indicator that disappears on its own', () => {
    renderMessage([basicMessage])

    expect(screen.queryByTestId(`message-copied-${basicMessage.id}`)).toBeNull()

    fireEvent(screen.getByTestId(`message-copy-${basicMessage.id}`), 'longPress')
    expect(screen.getByTestId(`message-copied-${basicMessage.id}`)).toBeTruthy()

    act(() => {
      jest.advanceTimersByTime(1500)
    })
    expect(screen.queryByTestId(`message-copied-${basicMessage.id}`)).toBeNull()
  })

  it('does not copy on a normal press', () => {
    renderMessage([basicMessage])

    fireEvent.press(screen.getByTestId(`message-copy-${basicMessage.id}`))

    expect(setString).not.toHaveBeenCalled()
    expect(screen.queryByTestId(`message-copied-${basicMessage.id}`)).toBeNull()
  })

  it('copies only the long-pressed message out of a grouped set', () => {
    const second: DisplayableMessage = { ...basicMessage, id: 'second-id', message: 'second message' }
    renderMessage([basicMessage, second])

    fireEvent(screen.getByTestId(`message-copy-${second.id}`), 'longPress')

    expect(setString).toHaveBeenCalledTimes(1)
    expect(setString).toHaveBeenCalledWith('second message')
    expect(screen.getByTestId(`message-copied-${second.id}`)).toBeTruthy()
    expect(screen.queryByTestId(`message-copied-${basicMessage.id}`)).toBeNull()
  })

  it('still opens a link when the link is tapped', () => {
    const { openUrl } = renderMessage([basicMessage])

    fireEvent.press(screen.getByText(LINK_HREF))

    expect(openUrl).toHaveBeenCalledWith(LINK_HREF)
    expect(setString).not.toHaveBeenCalled()
  })

  it('copies instead of opening a link when the long press starts on the link', () => {
    const { openUrl } = renderMessage([basicMessage])

    fireEvent(screen.getByText(LINK_HREF), 'longPress')

    expect(setString).toHaveBeenCalledWith(`Hello **world**, see ${LINK_HREF}`)
    expect(openUrl).not.toHaveBeenCalled()
  })

  it('does not make image messages copyable', () => {
    renderMessage([imageMessage])

    expect(screen.queryByTestId(`message-copy-${imageMessage.id}`)).toBeNull()
  })
})
