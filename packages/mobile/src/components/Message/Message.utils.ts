/**
 * Helpers that turn a raw message body into the markdown source handed to
 * `@ronradtke/react-native-markdown-display`.
 *
 * See https://github.com/TryQuiet/quiet/issues/1618
 */

/**
 * An opening or closing fence of a fenced code block. markdown-it allows up to three leading
 * spaces and a marker of three or more backticks or tildes, followed by an info string that only
 * an opening fence may carry.
 */
const FENCE_LINE = /^ {0,3}(`{3,}|~{3,})(.*)$/

const isBlank = (line: string): boolean => line.trim().length === 0

interface MessageSegment {
  /** True for the lines of a fenced code block, fence delimiters included. */
  fenced: boolean
  lines: string[]
}

/**
 * Splits `lines` into alternating prose and fenced-code segments. Fenced segments are carried
 * through every transformation untouched, so a code block keeps the exact blank lines its author
 * typed. An unterminated fence swallows the rest of the message, which is how markdown-it reads it
 * too.
 */
const splitFencedCode = (lines: string[]): MessageSegment[] => {
  const segments: MessageSegment[] = []
  let current: MessageSegment = { fenced: false, lines: [] }
  let openingMarker: string | null = null

  for (const line of lines) {
    const fence = FENCE_LINE.exec(line)

    if (openingMarker === null) {
      if (fence) {
        segments.push(current)
        openingMarker = fence[1]
        current = { fenced: true, lines: [line] }
      } else {
        current.lines.push(line)
      }
      continue
    }

    current.lines.push(line)
    // A closing fence repeats the opening marker at least as many times and carries no info string.
    const closesFence =
      fence != null && fence[1][0] === openingMarker[0] && fence[1].length >= openingMarker.length && isBlank(fence[2])
    if (closesFence) {
      segments.push(current)
      openingMarker = null
      current = { fenced: false, lines: [] }
    }
  }

  segments.push(current)
  return segments.filter(segment => segment.lines.length > 0)
}

type Block = { kind: 'blank' } | { kind: 'text'; line: string } | { kind: 'fenced'; lines: string[] }

/**
 * Drops the blank lines that lead or trail a message and collapses every longer run of them into a
 * single blank line, so a message padded with whitespace takes up no more room than the desktop
 * renderer gives it. Whitespace-only lines count as blank, otherwise a client could pad a message
 * with lines of spaces and get the same wall of empty space. Content inside a fenced code block is
 * never touched.
 */
export const normalizeMessageWhitespace = (message: string): string => {
  const blocks: Block[] = []
  for (const segment of splitFencedCode(message.replace(/\r\n?/g, '\n').split('\n'))) {
    if (segment.fenced) {
      blocks.push({ kind: 'fenced', lines: segment.lines })
    } else {
      for (const line of segment.lines) {
        blocks.push(isBlank(line) ? { kind: 'blank' } : { kind: 'text', line })
      }
    }
  }

  const kept: Block[] = []
  for (const block of blocks) {
    const previous = kept[kept.length - 1]
    if (block.kind === 'blank' && (previous === undefined || previous.kind === 'blank')) continue
    kept.push(block)
  }
  while (kept.length > 0 && kept[kept.length - 1].kind === 'blank') kept.pop()

  return kept
    .flatMap(block => {
      if (block.kind === 'fenced') return block.lines
      return block.kind === 'blank' ? [''] : [block.line]
    })
    .join('\n')
}

/**
 * markdown-it turns any run of blank lines into a single paragraph break, and the mobile paragraph
 * rule renders paragraphs with no margin, so a blank line the author typed would otherwise vanish.
 * Replacing it with a literal `<br>` keeps the text around it inside one paragraph, where the soft
 * breaks on either side of the `<br>` render as the blank line. Lines inside a fenced code block
 * are left alone, because there the `<br>` would be shown verbatim as code.
 */
const pushBr = (message: string): string =>
  splitFencedCode(message.split('\n'))
    .flatMap(segment => (segment.fenced ? segment.lines : segment.lines.map(line => (line === '' ? '<br>' : line))))
    .join('\n')

/** The markdown source for a message body: blank lines normalised, then kept visible as `<br>`. */
export const toMarkdownSource = (message: string): string => pushBr(normalizeMessageWhitespace(message))
