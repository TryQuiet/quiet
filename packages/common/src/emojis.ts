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
// sequence (`1️⃣`). One emoji is one of:
//
//   [0-9#*]\uFE0F?\u20E3            a keycap: 1️⃣
//   \p{RI}\p{RI}                    a regional-indicator pair, i.e. a flag: 🇵🇱
//   \p{Extended_Pictographic}(?:…)* a pictograph and anything bound to it: a skin-tone modifier,
//                                   the presentation selector, a subdivision flag's tag run, and a
//                                   zero-width joiner leading to the next pictograph: 👍🏽 🏴󠁧󠁢󠁳󠁣󠁴󠁿 ❤️‍🔥
//
// The pattern matches exactly one emoji and never repeats itself. `splitEmoji` walks it across the
// string and joins neighbours, which is what puts the two halves of a joined pair (`🐈` + `⬛`) in
// one run. Wrapping it in a repetition instead leaves its own tail ambiguous with the next repeat -
// a variation selector could be taken by either - which is the shape CodeQL reports as
// `js/polynomial-redos`, and a message is untrusted input. One emoji at a time has no such choice.
//
// Keep this one regex literal, assembled from nothing. A bundler rewrites a literal's property
// escapes and astral ranges for the engine it targets - Metro does, for Hermes - so reading
// `.source` back off a fragment and building the real pattern from the pieces gives a pattern that
// no longer means the same thing, or anything, under the `u` flag.
const EMOJI =
  /[0-9#*]\uFE0F?\u20E3|\p{RI}\p{RI}|\p{Extended_Pictographic}(?:[\p{Emoji_Modifier}\uFE0F\u{E0020}-\u{E007F}]|\u200D)*/gu

// Splits a string into text/emoji runs so callers can style emoji separately.
export const splitEmoji = (testString: string): TextSegment[] => {
  EMOJI.lastIndex = 0
  const segments: TextSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = EMOJI.exec(testString)) !== null) {
    const previous = segments[segments.length - 1]
    if (match.index > lastIndex) {
      segments.push({ text: testString.slice(lastIndex, match.index), isEmoji: false })
      segments.push({ text: match[0], isEmoji: true })
    } else if (previous?.isEmoji) {
      // Touching the emoji before it: one run, so a caller styles them as one.
      previous.text += match[0]
    } else {
      segments.push({ text: match[0], isEmoji: true })
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < testString.length) {
    segments.push({ text: testString.slice(lastIndex), isEmoji: false })
  }

  return segments
}

export const hasEmoji = (testString: string) => {
  EMOJI.lastIndex = 0
  return EMOJI.test(testString)
}

// True when a string is nothing but emoji and whitespace. A string with no emoji in it at all,
// including an empty or whitespace-only one, is not all emoji.
export const isAllEmoji = (testString: string) => {
  const segments = splitEmoji(testString)
  return segments.some(segment => segment.isEmoji) && segments.every(segment => segment.isEmoji || !segment.text.trim())
}
