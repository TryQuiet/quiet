export interface TextSegment {
  text: string
  isEmoji: boolean
}

export const hasEmoji = (testString: string) => {
  // All strings with at least one emoji character should match this
  const regExp = /\p{Emoji}/gu
  return regExp.test(testString)
}

export const isAllEmoji = (testString: string) => {
  // Detect whether a string is entirely emojis (and whitespace and zero-width-joins, region indicators, etc)
  // This may need to be updated as Unicode's Emoji spec is a moving target
  const emojiOrWhitespaceRegExp = /^(\p{Emoji}|\p{Emoji_Modifier}|\uFE0F|\u200D|\p{RI}|\uE007F|\s)+$/gu
  return emojiOrWhitespaceRegExp.test(testString)
}

// Splits a string into text/emoji runs so callers can style emoji separately.
// Shares isAllEmoji's known quirk: plain digits and '#'/'*' can be misread as emoji. to be fixed for all platforms
export const splitEmoji = (testString: string): TextSegment[] => {
  const emojiRunRegExp = /(\p{Emoji}|\p{Emoji_Modifier}|\uFE0F|\u200D|\p{RI}|\uE007F)+/gu
  const segments: TextSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = emojiRunRegExp.exec(testString)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: testString.slice(lastIndex, match.index), isEmoji: false })
    }
    segments.push({ text: match[0], isEmoji: true })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < testString.length) {
    segments.push({ text: testString.slice(lastIndex), isEmoji: false })
  }

  return segments
}
