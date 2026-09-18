import React, { type ReactNode } from 'react'
import { Text } from 'react-native'
import { type ASTNode, hasParents } from '@ronradtke/react-native-markdown-display'
import { splitEmoji } from '@quiet/common'

export const INLINE_EMOJI_FONT_SIZE = 22

// Inline emoji sizing is scoped to plain message text only — not blockquotes,
// lists, tables, links, bold/italic spans, or code.
const INLINE_EMOJI_EXCLUDED_ANCESTOR_TYPES = [
  'blockquote',
  'bullet_list',
  'ordered_list',
  'list_item',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'link',
  'blocklink',
  'strong',
  'em',
  'code_inline',
  'code_block',
  'fence',
]

// Exported for direct testing — the Markdown mock used in tests can't easily
// simulate nested AST ancestor chains (blockquote > text, link > text, etc.),
// so this is verified independently of the full render pipeline.
export const isPlainMessageText = (parent: ASTNode[]): boolean =>
  !INLINE_EMOJI_EXCLUDED_ANCESTOR_TYPES.some(type => hasParents(parent, type))

// Renders text with any emoji characters wrapped in a larger inline Text.
export const renderWithInlineEmoji = (text: string): ReactNode[] =>
  splitEmoji(text).map((segment, index) =>
    segment.isEmoji ? (
      <Text key={index} style={{ fontSize: INLINE_EMOJI_FONT_SIZE }}>
        {segment.text}
      </Text>
    ) : (
      segment.text
    )
  )
