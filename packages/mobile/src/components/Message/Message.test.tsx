import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Message } from './Message.component'

import { MessageType, type DisplayableMessage } from '@quiet/types'

// Message.test.disabled.tsx in this folder is unused and unrelated to these tests.

// setupTests.tsx mocks Markdown to skip custom rules; override it here
// so the font-size rule actually runs.
jest.mock('@ronradtke/react-native-markdown-display', () => ({
  __esModule: true,
  default: ({ children, rules }: any) => rules.paragraph(null, [children], null, null),
  MarkdownIt: jest.fn(() => ({})),
  hasParents: jest.fn(() => false),
}))

describe('Message component', () => {
  const baseProps = {
    duplicatedUsernameHandleBack: () => {},
    unregisteredUsernameHandleBack: (_username: string) => {},
    pendingMessages: {},
    openUrl: () => {},
    openImagePreview: () => {},
    downloadFile: () => {},
    cancelDownload: () => {},
  }

  const makeMessage = (text: string): DisplayableMessage => ({
    id: 'id',
    type: MessageType.Basic,
    message: text,
    createdAt: 0,
    date: '1:30pm',
    nickname: 'holmes',
    isDuplicated: false,
    isRegistered: true,
    userId: 'test',
  })

  const renderMessageText = (text: string) => {
    const { getByTestId } = renderComponent(<Message {...baseProps} data={[makeMessage(text)]} />)
    return getByTestId(text)
  }

  it('renders a regular text message at the default font size', () => {
    const text = 'Brownie powder marshmallow dessert carrot cake.'
    expect(renderMessageText(text).props.fontSize).toEqual(14)
  })

  it('renders an emoji-only message at a larger font size', () => {
    const text = '🎉🎉🎉'
    expect(renderMessageText(text).props.fontSize).toEqual(28)
  })

  it('keeps the default font size when a message mixes text and emoji', () => {
    const text = 'Hello 🎉'
    expect(renderMessageText(text).props.fontSize).toEqual(14)
  })
})
