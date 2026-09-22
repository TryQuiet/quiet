// The emoji-sizing cases live in their own file because each Message test file installs its
// own module-scope mock of @ronradtke/react-native-markdown-display, and two mocks of one
// module cannot share a file. Same split as Message.blankLines / downloads / status.
import React from 'react'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Message } from './Message.component'
import { isPlainMessageText } from './Message.utils'

import { MessageType, type DisplayableMessage } from '@quiet/types'

// Message.test.disabled.tsx in this folder is unused and unrelated to these tests.

// Overrides the global Markdown mock (setupTests.tsx) so the text/paragraph
// rules actually run, mirroring the real text -> paragraph flow. hasParents is
// real (not stubbed) so isPlainMessageText's exclusion logic is really tested.
jest.mock('@ronradtke/react-native-markdown-display', () => ({
  __esModule: true,
  default: ({ children, rules }: any) => {
    // Real ancestor chain for plain top-level message text: [paragraph, ...].
    const textNode = rules.text({ key: 'text', content: children }, [], [{ type: 'paragraph' }], {})
    return rules.paragraph(null, [textNode], null, null)
  },
  MarkdownIt: jest.fn(() => ({})),
  hasParents: jest.fn((parents: any[], type: string) => parents.findIndex((el: any) => el.type === type) > -1),
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

  const renderMessage = (text: string) => renderComponent(<Message {...baseProps} data={[makeMessage(text)]} />)

  const renderMessageText = (text: string) => renderMessage(text).getByTestId(text)

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

  it('renders an inline emoji within mixed text at a larger size than the surrounding text', () => {
    const { getByText } = renderMessage('Hello 🎉')
    expect(getByText('🎉').props.style.fontSize).toEqual(22)
  })

  it('renders multiple inline emoji in one message at the larger size', () => {
    const { getByText } = renderMessage('Great 🎉 job 🎊 everyone')
    expect(getByText('🎉').props.style.fontSize).toEqual(22)
    expect(getByText('🎊').props.style.fontSize).toEqual(22)
  })

  it('renders a message that is only digits at the default font size', () => {
    expect(renderMessageText('86').props.fontSize).toEqual(14)
    expect(renderMessageText('#general').props.fontSize).toEqual(14)
  })

  it('leaves the digits of a message with a number in it in the surrounding text', () => {
    // The regression: digits are keycap bases, so an emoji test built on `\p{Emoji}` pulled them
    // into their own enlarged Text and "86" was drawn much larger than the words around it.
    const { getByText, queryByText } = renderMessage('The score was 86 to 12')
    expect(getByText('The score was 86 to 12')).toBeTruthy()
    expect(queryByText('86')).toBeNull()
    expect(queryByText('12')).toBeNull()
  })

  it('renders a keycap emoji at the larger inline size', () => {
    const { getByText } = renderMessage('we meet on 1️⃣ today')
    expect(getByText('1️⃣').props.style.fontSize).toEqual(22)
  })

  it('renders a keycap-only message at the larger font size', () => {
    expect(renderMessageText('1️⃣').props.fontSize).toEqual(28)
  })

  describe('isPlainMessageText', () => {
    it('treats plain message text as eligible for inline emoji sizing', () => {
      expect(isPlainMessageText([])).toBe(true)
      expect(isPlainMessageText([{ type: 'paragraph' } as any])).toBe(true)
    })

    it('excludes text nested in blockquotes, lists, tables, links, and bold/italic spans', () => {
      expect(isPlainMessageText([{ type: 'blockquote' } as any])).toBe(false)
      expect(isPlainMessageText([{ type: 'list_item' } as any, { type: 'bullet_list' } as any])).toBe(false)
      expect(isPlainMessageText([{ type: 'td' } as any, { type: 'table' } as any])).toBe(false)
      expect(isPlainMessageText([{ type: 'link' } as any])).toBe(false)
      expect(isPlainMessageText([{ type: 'strong' } as any])).toBe(false)
      expect(isPlainMessageText([{ type: 'em' } as any])).toBe(false)
    })

    it('excludes text nested in inline code and code blocks', () => {
      expect(isPlainMessageText([{ type: 'code_inline' } as any])).toBe(false)
      expect(isPlainMessageText([{ type: 'code_block' } as any])).toBe(false)
      expect(isPlainMessageText([{ type: 'fence' } as any])).toBe(false)
    })
  })
})
