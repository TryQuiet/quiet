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
