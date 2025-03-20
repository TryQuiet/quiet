import { replaceEmojis, emojiShortcodes, emoticons } from './emojiCodes'

describe('Emoji code replacer', () => {
  it('Should replace shortcodes with emojis', () => {
    expect(replaceEmojis('Hello :smile: world')).toBe('Hello 😄 world')
    expect(replaceEmojis(':heart: is a heart')).toBe('❤️ is a heart')
    expect(replaceEmojis('Multiple: :fire: :rocket: :tada:')).toBe('Multiple: 🔥 🚀 🎉')
  })

  it('Should replace emoticons with emojis', () => {
    expect(replaceEmojis('Hello :) world')).toBe('Hello 🙂 world')
    expect(replaceEmojis('That was funny :D')).toBe('That was funny 😀')
    expect(replaceEmojis('Wink ;)')).toBe('Wink 😉')
  })

  it('Should handle mixed emoji codes and regular text', () => {
    expect(replaceEmojis('I :heart: coding and I am :) about it!')).toBe('I ❤️ coding and I am 🙂 about it!')
    expect(replaceEmojis("Let's :tada: and be :D")).toBe("Let's 🎉 and be 😀")
  })

  it('Should not replace emoticons that are part of words', () => {
    expect(replaceEmojis('example:) is not an emoji')).toBe('example:) is not an emoji')
    expect(replaceEmojis('someone@example.com :)')).toBe('someone@example.com 🙂')
  })

  it('Should handle multiple of the same emoji code', () => {
    expect(replaceEmojis(':smile: :smile: :smile:')).toBe('😄 😄 😄')
    expect(replaceEmojis(':) :) :) Hello')).toBe('🙂 🙂 🙂 Hello')
  })

  it('Should not affect text without emoji codes', () => {
    expect(replaceEmojis('Regular text with no emojis')).toBe('Regular text with no emojis')
    expect(replaceEmojis('Text with : character but no emoji')).toBe('Text with : character but no emoji')
  })
})
