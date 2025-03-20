// Emoji shortcode mapping
export interface EmojiMapping {
  [key: string]: string
}

// Common emoji shortcodes (GitHub/Slack style) - this is a starting point, can be expanded
export const emojiShortcodes: EmojiMapping = {
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
export const emoticons: EmojiMapping = {
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

// Function to convert emoji shortcodes in text to actual emojis
export function replaceEmojis(text: string): string {
  let result = text

  // Replace shortcodes like :smile:
  Object.entries(emojiShortcodes).forEach(([code, emoji]) => {
    result = result.replace(new RegExp(code.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1'), 'g'), emoji)
  })

  // Replace emoticons like :) - escape special characters
  Object.entries(emoticons).forEach(([code, emoji]) => {
    // Escape for regex - emoticons often contain special regex characters
    const escapedCode = code.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1')

    // Lookbehind/lookahead to ensure we're matching standalone emoticons, not parts of words
    // This ensures we don't match parts of URLs or other text
    const pattern = `(?<=[\\s]|^)${escapedCode}(?=[\\s]|$)`

    try {
      const regex = new RegExp(pattern, 'g')
      result = result.replace(regex, emoji)
    } catch (e) {
      // If regex creation fails, try a simpler approach
      result = result.replace(new RegExp(`\\s${escapedCode}(\\s|$)`, 'g'), ` ${emoji}$1`)
      // Handle start of string
      if (result.startsWith(code + ' ')) {
        result = result.replace(new RegExp(`^${escapedCode}\\s`, 'g'), `${emoji} `)
      }
      if (result === code) {
        result = emoji
      }
    }
  })

  return result
}
