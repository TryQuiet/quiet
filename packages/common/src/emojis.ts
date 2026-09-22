export interface TextSegment {
  text: string
  isEmoji: boolean
}

// One pattern, three helpers, so nothing that sizes emoji can disagree about what an emoji is.
//
// It follows Unicode TR51's sequence grammar rather than the `Emoji` property. `\p{Emoji}` also
// carries every plain ASCII keycap *base* - `0`-`9`, `#` and `*` - so anything built on it reports
// "86" or "#general" as emoji, and a caller that sizes emoji separately then draws the digits of an
// ordinary message at emoji size. Here a digit, `#` or `*` counts only as part of a complete keycap
// sequence (`1️⃣`). A single emoji is one of:
//
//   [0-9#*]\uFE0F?\u20E3                   a keycap:               1️⃣
//   \p{RI}\p{RI}                           a regional-indicator pair, i.e. a flag: 🇵🇱
//   \p{Extended_Pictographic}[…]*          a pictograph, with any skin-tone modifier, emoji
//                                          presentation selector, or subdivision-flag tag run: 👍🏽 🏴󠁧󠁢󠁳󠁣󠁴󠁿
//
// and a zero-width joiner binds one to the next (`🐈‍⬛`, `❤️‍🔥`), so a run of them is a single emoji.
//
// Keep this one regex literal, assembled from nothing. A bundler rewrites a literal's property
// escapes and astral ranges for the engine it targets - Metro does, for Hermes - so reading
// `.source` back off a fragment and building the real pattern from the pieces gives a pattern that
// no longer means the same thing, or anything, under the `u` flag.
const EMOJI_RUN =
  /(?:\u200D?(?:[0-9#*]\uFE0F?\u20E3|\p{RI}\p{RI}|\p{Extended_Pictographic}[\p{Emoji_Modifier}\uFE0F\u{E0020}-\u{E007F}]*))+/gu

// Splits a string into text/emoji runs so callers can style emoji separately.
export const splitEmoji = (testString: string): TextSegment[] => {
  EMOJI_RUN.lastIndex = 0
  const segments: TextSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = EMOJI_RUN.exec(testString)) !== null) {
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

export const hasEmoji = (testString: string) => {
  EMOJI_RUN.lastIndex = 0
  return EMOJI_RUN.test(testString)
}

// True when a string is nothing but emoji and whitespace. A string with no emoji in it at all,
// including an empty or whitespace-only one, is not all emoji.
export const isAllEmoji = (testString: string) => {
  const segments = splitEmoji(testString)
  return segments.some(segment => segment.isEmoji) && segments.every(segment => segment.isEmoji || !segment.text.trim())
}
