import { is } from "ramda"

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
  'o_O': '😳',
  'O_o': '😳',
  'O_O': '😳',
  '>:(': '😠',
  '>:-(': '😠',
  '>:)': '😈',
  '>:-)': '😈',
  '<3': '❤️',
  '(y)': '👍',
  '(n)': '👎',
}
  // we don't need to check if every word is in a protected region on send, because all words have already been checked on typing
  // so we can just check the last word

function extractLastWord(text: string): string {
  return text.split(' ').pop() || '' // TODO: make this more robust by using a proper regex that includes punctuation like period and comma
}

function isLastWordProtected(text: string): boolean {
  return false // TODO: replace this with a RegExp that checks if last word , and only the last word, is in a protected region
}

function replaceWordIfEmojicode(word: string): string {
  return word // TODO: make this function replace the word with an emoji if it's a valid emoji code or emoticon. also make it return a cursor offset in addition to the word 
}

export function replaceLastWordBeforeCursorWithEmojiIfUnprotected(text: string, cursorPosition: number): { string, number } // TODO: add the return type and fix ts syntax
{
  const textBeforeCursor = text.substring(0, cursorPosition)
  if (isLastWordProtected(textBeforeCursor)) {
    return { text, cursorOffset: 0 }
  }
  const lastWord = extractLastWord(textBeforeCursor)
  const textAfterCursor = text.substring(cursorPosition)
  const textBeforeLastWord = textBeforeCursor.substring(0, textBeforeCursor.length - extractLastWord(textBeforeCursor).length)
  const newEmoji = replaceWordIfEmojicode(lastWord).wordOrNewEmoji
  const emojiWordLengthDifference = wordOrNewEmoji.length - lastWord.length
  const newText = textBeforeLastWord + wordOrNewEmoji + textAfterCursor // replaceWordIfEmojicode should return an emoji with an offset
  const cursorOffset = 0 // TODO: calculate the offset based on the length of the last word and the emoji that replaces it
  return { newText, cursorOffset: newCursorOffset } // TODO: complete this function so that the offset changes and the text is updated
}

export function replaceLastEmoji(text: string): string {
  if (isLastWordProtected(text)) {
    return text
  }
  return text // TODO: replace the last word with an emoji if it's a valid emoji code or emoticon and not in a protected region
}  
 
