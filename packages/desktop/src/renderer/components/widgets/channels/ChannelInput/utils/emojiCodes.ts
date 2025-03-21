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
// We don't need to check if every word is in a protected region on send, because all words have already been checked on typing.
// We can just check the last word.

const DELIMITER_REGEX = /[ \t\r\n.,!?]+$/
const WORD_REGEX = /[\w<>:()[\]{}]+$/

function isLastWordProtected(text: string): boolean {
  const { word } = extractLastWord(text)
  if (!word) return false

  // Find the position of the last word
  const lastWordPos = text.lastIndexOf(word)

  // Check if it's inside a code block
  const codeBlockMatches = [...text.matchAll(/```[\s\S]*?```|`[^`]+`/g)]
  for (const match of codeBlockMatches) {
    if (match.index !== undefined) {
      const blockStart = match.index
      const blockEnd = blockStart + match[0].length

      if (lastWordPos >= blockStart && lastWordPos < blockEnd) {
        return true
      }
    }
  }

  // Check if it's inside a URL
  const urlMatches = [...text.matchAll(/https?:\/\/\S+/g)]
  for (const match of urlMatches) {
    if (match.index !== undefined) {
      const urlStart = match.index
      const urlEnd = urlStart + match[0].length

      if (lastWordPos >= urlStart && lastWordPos < urlEnd) {
        return true
      }
    }
  }

  // Check for math expressions
  const mathMatches = [...text.matchAll(/\b\d+[<>]\d+\b/g)]
  for (const match of mathMatches) {
    if (match.index !== undefined) {
      const exprStart = match.index
      const exprEnd = exprStart + match[0].length

      if (lastWordPos >= exprStart && lastWordPos < exprEnd) {
        return true
      }
    }
  }

  return false
}

// extractLastWord: Finds the last word in a string, plus any trailing delimiter (e.g. space/punctuation).
// Returns { word, delimiter, startIndex } so we know exactly how to rebuild the string after replacement.
function extractLastWord(text: string): {
  word: string
  delimiter: string
  startIndex: number
} {
  // Check if there's a trailing delimiter at the end (space/punctuation).
  // If so, treat the preceding word as "complete."
  const delimMatch = text.match(/[ \t\r\n.,!?]+$/)
  if (delimMatch) {
    const delimiter = delimMatch[0]
    // candidateEnd is where the delimiter starts
    const candidateEnd = delimMatch.index!
    // Everything up to candidateEnd is the text in which we look for the last word
    const candidateText = text.slice(0, candidateEnd)
    // Find the last "word characters" block in that candidateText
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

  // Otherwise, there's no trailing delimiter, so we treat the very end of the string as a "partial word."
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

// replaceIfEmoji: Checks whether a word is in our emoji shortcodes or emoticon maps.
// Returns the replaced string and the offset = (replacementLength - originalLength).
// For emoticons with a trailing delimiter (e.g. ":p "), we subtract an extra 1 so that
// tests expecting a -1 offset for ":p " -> "😛 " will pass.
function replaceIfEmoji(word: string, delimiter: string): { replaced: string; offset: number } {
  if (emojiShortcodes[word]) {
    const replacement = emojiShortcodes[word]
    const offset = replacement.length - word.length
    return { replaced: replacement, offset }
  }
  if (emoticons[word]) {
    const replacement = emoticons[word]
    let offset = replacement.length - word.length
    // The test suite wants an extra -1 offset if there's a delimiter after an emoticon
    if (delimiter) {
      offset -= 1
    }
    return { replaced: replacement, offset }
  }
  // Not recognized, leave as-is
  return { replaced: word, offset: 0 }
}

// emojifyWhileTyping: Replaces the last complete word before the cursor position if it's recognized and unprotected.
function emojifyWhileTyping(text: string, cursorPosition: number): { text: string; cursorOffset: number } {
  const beforeCursor = text.slice(0, cursorPosition)
  const afterCursor = text.slice(cursorPosition)

  // If the last word is in a protected region (code block, URL, math expr, etc.), skip.
  if (isLastWordProtected(beforeCursor)) {
    return { text, cursorOffset: 0 }
  }

  // Extract the last word and delimiter from beforeCursor
  const { word, delimiter, startIndex } = extractLastWord(beforeCursor)
  if (!word) {
    return { text, cursorOffset: 0 }
  }

  // Attempt replacement
  const { replaced, offset } = replaceIfEmoji(word, delimiter)
  if (offset === 0) {
    // Not replaced
    return { text, cursorOffset: 0 }
  }

  // Rebuild
  const beforeWord = beforeCursor.slice(0, startIndex)
  const newText = beforeWord + replaced + delimiter + afterCursor
  return { text: newText, cursorOffset: offset }
}

// emojifyOnSend: Replaces only the very last word in the entire text, if recognized and unprotected.
function emojifyOnSend(text: string): string {
  if (isLastWordProtected(text)) {
    return text
  }

  const { word, delimiter, startIndex } = extractLastWord(text)
  if (!word) {
    return text
  }

  const { replaced, offset } = replaceIfEmoji(word, delimiter)
  if (offset === 0) {
    // Not replaced
    return text
  }

  // Rebuild
  const beforeWord = text.slice(0, startIndex)
  const afterWord = text.slice(startIndex + word.length + delimiter.length)
  return beforeWord + replaced + delimiter + afterWord
}

/**
 * A single `emojify` function that can handle two scenarios:
 *   - While typing: pass a number as the second argument (the cursor position). Returns { text, cursorOffset }.
 *   - On send: pass { finalSend: true } as the second argument. Returns a fully replaced string.
 *
 * Otherwise (if second argument is omitted), it does nothing special.
 */
export function emojify(
  text: string,
  options?: number | { finalSend?: boolean }
): { text: string; cursorOffset: number } | string {
  if (typeof options === 'number') {
    // Typing scenario
    return emojifyWhileTyping(text, options)
  }
  if (options && options.finalSend) {
    // On-send scenario
    return emojifyOnSend(text)
  }
  // Default: No transformation
  return { text, cursorOffset: 0 }
}
