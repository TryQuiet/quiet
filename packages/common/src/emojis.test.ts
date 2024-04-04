import { hasEmoji, isAllEmoji } from './emojis'

describe('Emoji Utilities', () => {
  it('Should detect an emoji in a string', () => {
    expect(hasEmoji('❤️‍🔥')).toBeTruthy()
    expect(hasEmoji('Hello ❤️‍🔥 Emoji')).toBeTruthy()
    expect(hasEmoji('No emoji :-(')).toBeFalsy()
  })

  it('Should detect when a string is all emojis (or spaces)', () => {
    expect(isAllEmoji('🙂🙂🙂🙂🙂🙂🙂🙂')).toBeTruthy()
    expect(isAllEmoji('🐈‍⬛❤️‍🔥🏴')).toBeTruthy()
    expect(isAllEmoji('🐈‍⬛ ❤️‍🔥 🏴')).toBeTruthy()
    expect(isAllEmoji('❤️‍🔥')).toBeTruthy()
    expect(isAllEmoji('🐈‍⬛')).toBeTruthy()
    expect(isAllEmoji('❤️‍🔥 Emoji')).toBeFalsy()
    expect(isAllEmoji('Hello ❤️‍🔥')).toBeFalsy()
    expect(isAllEmoji('Hello ❤️‍🔥 Emoji')).toBeFalsy()
    expect(isAllEmoji('🐈‍⬛ (Not emoji) 🏴')).toBeFalsy()
    expect(isAllEmoji('No emoji :-(')).toBeFalsy()
  })
})
