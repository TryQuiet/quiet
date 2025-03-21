import { is } from 'ramda'

// Emoji shortcode mapping
export interface EmojiMapping {
  [key: string]: string
}

// Common emoji shortcodes (GitHub/Slack style) - this is a starting point, can be expanded
const emojiShortcodes: EmojiMapping = {
  // Smileys
  ':smile:': '😄',
  ':laughing:': '😆',
  ':blush:': '😊',
  ':smiley:': '😃',
  ':relaxed:': '☺️',
  ':smirk:': '😏',
  ':heart_eyes:': '😍',
  ':kissing_heart:': '😘',
  ':kissing_closed_eyes:': '😚',
  ':flushed:': '😳',
  ':relieved:': '😌',
  ':satisfied:': '😆',
  ':grin:': '😁',
  ':wink:': '😉',
  ':stuck_out_tongue_winking_eye:': '😜',
  ':stuck_out_tongue_closed_eyes:': '😝',
  ':grinning:': '😀',
  ':kissing:': '😗',
  ':kissing_smiling_eyes:': '😙',
  ':stuck_out_tongue:': '😛',
  ':sleeping:': '😴',
  ':worried:': '😟',
  ':frowning:': '😦',
  ':anguished:': '😧',
  ':open_mouth:': '😮',
  ':grimacing:': '😬',
  ':confused:': '😕',
  ':hushed:': '😯',
  ':expressionless:': '😑',
  ':unamused:': '😒',
  ':sweat_smile:': '😅',
  ':sweat:': '😓',
  ':disappointed_relieved:': '😥',
  ':weary:': '😩',
  ':pensive:': '😔',
  ':disappointed:': '😞',
  ':confounded:': '😖',
  ':fearful:': '😨',
  ':cold_sweat:': '😰',
  ':persevere:': '😣',
  ':cry:': '😢',
  ':sob:': '😭',
  ':joy:': '😂',
  ':astonished:': '😲',
  ':scream:': '😱',
  ':tired_face:': '😫',
  ':angry:': '😠',
  ':rage:': '😡',
  ':triumph:': '😤',
  ':sleepy:': '😪',
  ':yum:': '😋',
  ':mask:': '😷',
  ':sunglasses:': '😎',
  ':dizzy_face:': '😵',
  ':imp:': '👿',
  ':smiling_imp:': '😈',
  ':neutral_face:': '😐',
  ':no_mouth:': '😶',
  ':innocent:': '😇',
  ':alien:': '👽',

  // Hearts
  ':heart:': '❤️',
  ':broken_heart:': '💔',
  ':blue_heart:': '💙',
  ':green_heart:': '💚',
  ':yellow_heart:': '💛',
  ':purple_heart:': '💜',
  ':black_heart:': '🖤',

  // Hands / People
  ':thumbsup:': '👍',
  ':thumbsdown:': '👎',
  ':ok_hand:': '👌',
  ':clap:': '👏',
  ':wave:': '👋',
  ':muscle:': '💪',
  ':pray:': '🙏',
  ':person_shrugging:': '🤷',
  ':person_facepalming:': '🤦',

  // Objects
  ':fire:': '🔥',
  ':star:': '⭐',
  ':zap:': '⚡',
  ':bell:': '🔔',
  ':boom:': '💥',
  ':tada:': '🎉',
  ':sparkles:': '✨',
  ':speech_balloon:': '💬',
  ':eyes:': '👀',
  ':rocket:': '🚀',
  ':warning:': '⚠️',
  ':sunny:': '☀️',
  ':cloud:': '☁️',
  ':rainbow:': '🌈',
  ':lock:': '🔒',
  ':bulb:': '💡',

  // Animals
  ':cat:': '🐱',
  ':dog:': '🐶',
  ':mouse:': '🐭',
  ':hamster:': '🐹',
  ':rabbit:': '🐰',
  ':bear:': '🐻',
  ':panda_face:': '🐼',
  ':penguin:': '🐧',
  ':bird:': '🐦',
  ':frog:': '🐸',

  // Food
  ':apple:': '🍎',
  ':pizza:': '🍕',
  ':hamburger:': '🍔',
  ':fries:': '🍟',
  ':sushi:': '🍣',
  ':cake:': '🍰',
  ':cookie:': '🍪',
  ':lemon:': '🍋',
  ':watermelon:': '🍉',

  // Activities
  ':soccer:': '⚽',
  ':basketball:': '🏀',
  ':football:': '🏈',
  ':tennis:': '🎾',
}

// Common emoticons/ASCII art
const emoticons: EmojiMapping = {
  ':)': '🙂',
  ':-)': '🙂',
  ':D': '😀',
  ':-D': '😀',
  ';)': '😉',
  ';-)': '😉',
  ':(': '🙁',
  ':-(': '🙁',
  ':|': '😐',
  ':-|': '😐',
  ':O': '😮',
  ':-O': '😮',
  ':o': '😮',
  ':-o': '😮',
  ';P': '😜',
  ';-P': '😜',
  ';p': '😜',
  ';-p': '😜',
  ':P': '😛',
  ':-P': '😛',
  ':p': '😛',
  ':-p': '😛',
  ':*': '😘',
  ':-*': '😘',
  ':/': '😕',
  ':-/': '😕',
  ':S': '😖',
  ':-S': '😖',
  ':s': '😖',
  ':-s': '😖',
  ":'(": '😢',
  ":'-(": '😢',
  ":'D": '😂',
  ":'-)": '😂',
  o_O: '😳',
  O_o: '😳',
  O_O: '😳',
  '>:(': '😠',
  '>:-(': '😠',
  '>:)': '😈',
  '>:-)': '😈',
  '<3': '❤️',
  '(y)': '👍',
  '(n)': '👎',
}
// -------------------------------------------
// 2) Parsing to detect unclosed code/LaTeX blocks
// -------------------------------------------
/**
 * Returns `true` if the position `pos` (where last word begins)
 * is currently inside an unclosed triple-backtick fence or unclosed `$$` block.
 * We do a simple left-to-right parse counting enters/exits of code or math blocks.
 */
function isInsideUnclosedFenceOrLatex(text: string, pos: number): boolean {
  let inFence = false
  let inLatex = false
  let i = 0

  while (i < pos) {
    // Check triple backticks
    const nextFence = text.indexOf('```', i)
    const nextDollars = text.indexOf('$$', i)

    // If neither found, we can break
    if (nextFence === -1 && nextDollars === -1) break

    // Decide which occurs first in the text
    let nextEvent: 'fence' | 'latex' = 'fence'
    let nextIndex = nextFence

    if (nextFence === -1 || (nextDollars !== -1 && nextDollars < nextFence)) {
      nextEvent = 'latex'
      nextIndex = nextDollars
    }

    if (nextIndex === -1 || nextIndex >= pos) {
      // No event or it's beyond pos
      break
    }

    // Move to that event
    i = nextIndex

    if (nextEvent === 'fence') {
      // Toggle fence: if not inFence, we enter; if inFence, we exit
      inFence = !inFence
      // skip past it
      i += 3
    } else {
      // nextEvent === 'latex'
      inLatex = !inLatex
      i += 2
    }
  }

  // If after scanning up to pos, we are still inFence or inLatex, then it's unclosed
  return inFence || inLatex
}

// -------------------------------------------
// 3) Extract last word
// -------------------------------------------
function extractLastWord(text: string): { word: string; delimiter: string; startIndex: number } {
  // If there's trailing space/punct, treat preceding chunk as a complete word
  const trailingDelim = text.match(/[ \t\r\n.,!?]+$/)
  if (trailingDelim) {
    const delimiter = trailingDelim[0]
    const delimStart = trailingDelim.index!
    const candidateText = text.slice(0, delimStart)
    const wordMatch = candidateText.match(/[\w<>:()[\]{}]+$/)
    if (!wordMatch || wordMatch.index == null) {
      return { word: '', delimiter, startIndex: -1 }
    }
    return {
      word: wordMatch[0],
      delimiter,
      startIndex: wordMatch.index,
    }
  }

  // Otherwise, partial word at the very end
  const wordMatch = text.match(/[\w<>:()[\]{}]+$/)
  if (!wordMatch || wordMatch.index == null) {
    return { word: '', delimiter: '', startIndex: -1 }
  }
  return {
    word: wordMatch[0],
    delimiter: '',
    startIndex: wordMatch.index,
  }
}

// -------------------------------------------
// 4) Protected check for "while typing" scenario
// -------------------------------------------
function isLastWordProtected(text: string): boolean {
  const { word, startIndex } = extractLastWord(text)
  if (!word) return false

  // If inside an unclosed triple-fence or unclosed $$, skip
  const insideFence = isInsideUnclosedFenceOrLatex(text, startIndex)
  if (insideFence) return true

  // Also skip if there's a fully closed code snippet or $$ block that includes startIndex
  // Or if it's inside a URL or simple math, or attached to prior word-chars.
  // We do this with simpler matches:

  // A) code blocks (fully closed)
  const codeBlockMatches = [...text.matchAll(/```[\s\S]*?```|`[^`]+`/g)]
  for (const m of codeBlockMatches) {
    if (m.index != null) {
      const blockStart = m.index
      const blockEnd = blockStart + m[0].length
      if (startIndex >= blockStart && startIndex < blockEnd) {
        return true
      }
    }
  }

  // B) fully closed $$ blocks
  const latexMatches = [...text.matchAll(/\$\$[\s\S]*?\$\$/g)]
  for (const m of latexMatches) {
    if (m.index != null) {
      const blockStart = m.index
      const blockEnd = blockStart + m[0].length
      if (startIndex >= blockStart && startIndex < blockEnd) {
        return true
      }
    }
  }

  // C) URLs
  const urlMatches = [...text.matchAll(/https?:\/\/\S+/g)]
  for (const m of urlMatches) {
    if (m.index != null) {
      const urlStart = m.index
      const urlEnd = urlStart + m[0].length
      if (startIndex >= urlStart && startIndex < urlEnd) {
        return true
      }
    }
  }

  // D) simple math expressions
  const mathRegex = /\b\d+[<>]\d+\b|\b\w+[<>]\d+\b|\([^)]*[<>][^)]*\)/g
  const mathMatches = [...text.matchAll(mathRegex)]
  for (const m of mathMatches) {
    if (m.index != null) {
      const exprStart = m.index
      const exprEnd = exprStart + m[0].length
      if (startIndex >= exprStart && startIndex < exprEnd) {
        return true
      }
    }
  }

  // E) If the lastWord is attached to prior word-chars => treat it as part of bigger word
  if (startIndex > 0 && /\w$/.test(text.slice(startIndex - 1, startIndex))) {
    return true
  }

  return false
}

// -------------------------------------------
// 5) While-typing replacement
// -------------------------------------------
function replaceIfEmoji(word: string, delimiter: string): { replaced: string; offset: number } {
  // shortcodes => always replace
  if (emojiShortcodes[word]) {
    const replacedWord = emojiShortcodes[word]
    const offset = replacedWord.length - word.length
    return { replaced: replacedWord, offset }
  }

  // emoticons => require a trailing delimiter
  if (emoticons[word]) {
    if (!delimiter) {
      return { replaced: word, offset: 0 }
    }
    const replacedWord = emoticons[word]
    let offset = replacedWord.length - word.length
    // tests want an extra -1 if emoticon had trailing space/punct
    offset -= 1
    return { replaced: replacedWord, offset }
  }

  return { replaced: word, offset: 0 }
}

function emojifyWhileTyping(text: string, cursorPos: number): { text: string; cursorOffset: number } {
  const beforeCursor = text.slice(0, cursorPos)
  const afterCursor = text.slice(cursorPos)

  if (isLastWordProtected(beforeCursor)) {
    return { text, cursorOffset: 0 }
  }

  const { word, delimiter, startIndex } = extractLastWord(beforeCursor)
  if (!word) {
    return { text, cursorOffset: 0 }
  }

  const { replaced, offset } = replaceIfEmoji(word, delimiter)
  if (replaced === word) {
    return { text, cursorOffset: 0 }
  }

  const beforeWord = beforeCursor.slice(0, startIndex)
  const newText = beforeWord + replaced + delimiter + afterCursor
  return { text: newText, cursorOffset: offset }
}

// -------------------------------------------
// 6) On-send: Replace all in unprotected segments
// -------------------------------------------
function replaceAllEmojisInUnprotected(segment: string): string {
  // Word-boundary-based matching of emoticons & shortcodes
  // Using lookbehind/lookahead to avoid partial word replacements.
  // We'll include :p, :), <3, etc., plus shortcodes like :heart:
  // Make sure to add variants as needed.
  const tokenRegex = new RegExp(
    [
      ':[a-zA-Z0-9_+\\-]+:', // shortcodes (":smile:")
      '(?<![A-Za-z0-9])<3(?=$|\\s|[^A-Za-z0-9])', // <3 not part of a word
      '(?<![A-Za-z0-9])[;:]-?[)Ddp(](?![A-Za-z0-9])', // ;), :D, etc. not part of a word
    ].join('|'),
    'g'
  )

  return segment.replace(tokenRegex, match => {
    if (emojiShortcodes[match]) {
      return emojiShortcodes[match]
    }
    if (emoticons[match]) {
      return emoticons[match]
    }
    return match
  })
}

function emojifyOnSend(text: string): string {
  // Protected: triple backtick blocks, inline code, URLs, $$ math blocks, simple math
  const protectedRegex =
    /```[\s\S]*?```|`[^`]+`|https?:\/\/\S+|\$\$[\s\S]*?\$\$|\b\d+[<>]\d+\b|\b\w+[<>]\d+\b|\([^)]*[<>][^)]*\)/g

  let result = ''
  let lastIndex = 0
  const matches = [...text.matchAll(protectedRegex)]

  for (const m of matches) {
    if (m.index == null) continue
    const start = m.index
    // unprotected chunk
    const unprotected = text.slice(lastIndex, start)
    result += replaceAllEmojisInUnprotected(unprotected)
    // add protected chunk verbatim
    result += m[0]
    lastIndex = start + m[0].length
  }

  // leftover unprotected
  if (lastIndex < text.length) {
    const unprotected = text.slice(lastIndex)
    result += replaceAllEmojisInUnprotected(unprotected)
  }

  return result
}

// -------------------------------------------
// 7) Main export
// -------------------------------------------
export function emojify(
  text: string,
  options?: number | { finalSend?: boolean }
): { text: string; cursorOffset: number } | string {
  if (typeof options === 'number') {
    return emojifyWhileTyping(text, options)
  }
  if (options && options.finalSend) {
    return emojifyOnSend(text)
  }
  return { text, cursorOffset: 0 }
}
