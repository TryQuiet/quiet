import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { render } from '@testing-library/react'
import { withTheme } from '../../../storybook/decorators'
import { TextMessageComponent } from './TextMessage'

/**
 * Regression coverage for https://github.com/TryQuiet/quiet/issues/1618
 * ("Messages can have a ton of trailing whitespace").
 *
 * The issue asks that leading/trailing blank lines produced with shift+enter be
 * stripped on the RECEIVER side (so a malicious client can't force large blank
 * areas onto other people's screens by sending literal whitespace).
 *
 * Investigation for this pass found that TextMessageComponent already renders
 * this correctly today: it pipes `message` through ReactMarkdown (remark-gfm),
 * and CommonMark's block-level parser treats runs of blank lines purely as
 * paragraph separators - it never emits an empty paragraph for them. So blank
 * lines before the first real content or after the last are dropped entirely,
 * and a run of blank lines between two lines of text collapses to a single
 * paragraph boundary (one line break, rendered by the component's
 * `white-space: pre-line` CSS) regardless of how many blank lines the sender
 * typed. This holds for every receiving client, so a malicious sender gains
 * nothing by padding a message with blank lines.
 *
 * These tests lock that behavior in as a regression guard - they pass today
 * without any production code change. They also confirm the one thing that
 * must NOT be touched by any future change here: content inside a fenced code
 * block (blank lines, indentation) is untouched by this normalization.
 */
const helloWorld = (msg: string) => render(withTheme(() => <TextMessageComponent message={msg} messageId={'1618'} pending={false} openUrl={() => {}} />))

describe('TextMessage - issue #1618 blank line handling', () => {
  it('strips a large run of leading and trailing blank lines', () => {
    const message = '\n\n\n\n\nActual message content\n\n\n\n\n'
    const { getByTestId } = helloWorld(message)
    expect(getByTestId('messagesGroupContent-1618')).toHaveTextContent('Actual message content')
    expect(getByTestId('messagesGroupContent-1618').innerHTML).toBe('Actual message content')
  })

  it('collapses a large run of blank lines between two lines of real text to a single line break', () => {
    const message = 'first\n\n\n\n\n\nsecond'
    const { getByTestId } = helloWorld(message)
    // Only one newline should survive - no visible blank line/gap remains.
    expect(getByTestId('messagesGroupContent-1618').innerHTML).toBe('first\nsecond')
  })

  it('renders a message that is only blank lines as empty, not as a tall blank block', () => {
    const message = '\n\n\n\n\n\n\n\n\n\n'
    const { getByTestId } = helloWorld(message)
    expect(getByTestId('messagesGroupContent-1618')).toHaveTextContent('')
  })

  it('does not touch blank lines or indentation inside a fenced code block', () => {
    // Leading/trailing blank lines around the message are stripped, but blank
    // lines and indentation *inside* the fence must be preserved byte-for-byte.
    const message = '\n\n\n```\n\n  indented\ncode\n\n```\n\n\n'
    const { container } = helloWorld(message)
    const code = container.querySelector('code')
    expect(code).not.toBeNull()
    expect(code!.textContent).toBe('\n  indented\ncode\n\n')
  })

  it('does not collapse blank lines around a list, blockquote, or table', () => {
    const list = helloWorld('\n\n\n- a\n- b\n\n\n')
    expect(list.container.querySelector('ul')).not.toBeNull()
    expect(list.container.querySelector('ul')!.textContent?.trim()).toBe('a\nb')

    const blockquote = helloWorld('\n\n\n> quoted text\n\n\n')
    expect(blockquote.container.querySelector('blockquote')).not.toBeNull()
    expect(blockquote.container.querySelector('blockquote')!.textContent?.trim()).toBe('quoted text')

    const table = helloWorld('\n\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n\n')
    expect(table.container.querySelector('table')).not.toBeNull()
  })
})
