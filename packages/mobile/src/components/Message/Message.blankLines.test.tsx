import React from 'react'
import { MessageType } from '@quiet/types'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Message } from './Message.component'
import { normalizeMessageWhitespace, toMarkdownSource } from './Message.utils'

// https://github.com/TryQuiet/quiet/issues/1618 - a message padded with blank lines used to render
// one line break per blank line, so it could take over the whole channel view.

describe('normalizeMessageWhitespace', () => {
  const cases: Array<[name: string, input: string, expected: string]> = [
    ['collapses a run of blank lines to a single gap', 'a\n\n\n\n\nb', 'a\n\nb'],
    ['keeps a single blank line', 'a\n\nb', 'a\n\nb'],
    ['keeps a single newline', 'a\nb', 'a\nb'],
    ['drops trailing blank lines', 'a\n\n\n\n', 'a'],
    ['drops leading blank lines', '\n\na', 'a'],
    ['drops leading and trailing blank lines at once', '\n\n\na\n\n\n', 'a'],
    ['treats whitespace-only lines as blank', 'a\n   \n\t\n \nb', 'a\n\nb'],
    ['leaves a message with no blank lines alone', 'a\nb\nc', 'a\nb\nc'],
    ['empties a message that is nothing but blank lines', '\n\n\n   \n', ''],
    ['normalizes Windows line endings', 'a\r\n\r\n\r\n\r\nb\r\n\r\n', 'a\n\nb'],
    [
      'preserves blank lines inside a fenced code block',
      'a\n\n```\nx\n\n\n\ny\n```\n\n\nb',
      'a\n\n```\nx\n\n\n\ny\n```\n\nb',
    ],
    ['preserves blank lines inside a tilde fence', '~~~\n\n\n~~~', '~~~\n\n\n~~~'],
    ['preserves blank lines inside an unterminated fence', 'a\n\n```js\n\n\n', 'a\n\n```js\n\n\n'],
    ['does not treat a longer inner run as a closing fence', '````\n\n\n```\n\n\n````', '````\n\n\n```\n\n\n````'],
  ]

  it.each(cases)('%s', (_name, input, expected) => {
    expect(normalizeMessageWhitespace(input)).toEqual(expected)
  })
})

describe('toMarkdownSource', () => {
  it('keeps one blank line visible as a single <br>', () => {
    expect(toMarkdownSource('a\n\n\n\n\nb')).toEqual('a\n<br>\nb')
  })

  it('emits no <br> for a message padded with blank lines', () => {
    expect(toMarkdownSource('\n\n\nhello\n\n\n\n')).toEqual('hello')
  })

  it('never writes a <br> inside a fenced code block', () => {
    expect(toMarkdownSource('a\n\n```\nx\n\ny\n```')).toEqual('a\n<br>\n```\nx\n\ny\n```')
  })
})

// `@ronradtke/react-native-markdown-display` is mocked in setupTests.tsx to render
// `<div>{props.children}</div>`, so the markdown source handed to it is readable straight off the
// rendered tree.
const markdownSourceOf = (node: any): string | null => {
  if (!node || typeof node !== 'object') return null
  if (node.type === 'div' && typeof node.children?.[0] === 'string') return node.children[0]
  for (const child of node.children ?? []) {
    const found = markdownSourceOf(child)
    if (found !== null) return found
  }
  return null
}

const renderMessage = (message: string): string => {
  const { toJSON } = renderComponent(
    <Message
      duplicatedUsernameHandleBack={() => {}}
      unregisteredUsernameHandleBack={(_username: string) => {}}
      data={[
        {
          id: 'id',
          type: MessageType.Basic,
          message,
          createdAt: 0,
          date: '1:30pm',
          nickname: 'holmes',
          isDuplicated: false,
          isRegistered: true,
          userId: 'test',
        },
      ]}
      pendingMessages={{}}
      openUrl={() => {}}
      openImagePreview={() => {}}
      downloadFile={() => {}}
      cancelDownload={() => {}}
    />
  )
  const source = markdownSourceOf(toJSON())
  expect(source).not.toBeNull()
  return source as string
}

describe('Message blank line rendering', () => {
  it('renders no blank line for a message with ten trailing blank lines', () => {
    const source = renderMessage('hello' + '\n'.repeat(10))
    expect(source.match(/<br>/g) ?? []).toHaveLength(0)
    expect(source).toEqual('hello')
  })

  it('renders no blank line for a message with ten leading blank lines', () => {
    const source = renderMessage('\n'.repeat(10) + 'hello')
    expect(source.match(/<br>/g) ?? []).toHaveLength(0)
  })

  it('collapses a run of blank lines in the middle of a message to a single gap', () => {
    const source = renderMessage('a' + '\n'.repeat(6) + 'b')
    expect(source.match(/<br>/g) ?? []).toHaveLength(1)
  })

  it('still shows a single blank line between two paragraphs', () => {
    expect(renderMessage('a\n\nb')).toEqual('a\n<br>\nb')
  })
})
