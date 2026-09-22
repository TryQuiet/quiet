import { hasEmoji, isAllEmoji, splitEmoji } from './emojis'

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

  it('Should split text into text/emoji segments', () => {
    expect(splitEmoji('Hello world')).toEqual([{ text: 'Hello world', isEmoji: false }])

    expect(splitEmoji('🎉')).toEqual([{ text: '🎉', isEmoji: true }])

    expect(splitEmoji('Hello 🎉')).toEqual([
      { text: 'Hello ', isEmoji: false },
      { text: '🎉', isEmoji: true },
    ])

    expect(splitEmoji('🎉 Hello')).toEqual([
      { text: '🎉', isEmoji: true },
      { text: ' Hello', isEmoji: false },
    ])

    expect(splitEmoji('Great job 🎉 well done ❤️‍🔥!')).toEqual([
      { text: 'Great job ', isEmoji: false },
      { text: '🎉', isEmoji: true },
      { text: ' well done ', isEmoji: false },
      { text: '❤️‍🔥', isEmoji: true },
      { text: '!', isEmoji: false },
    ])

    // Known limitation, shared with isAllEmoji above: digits are eligible
    // keycap-emoji bases under \p{Emoji}, so they get misclassified as emoji
    // here too. Tracked for a proper fix in a follow-up issue.
    expect(splitEmoji('Room 123')).toEqual([
      { text: 'Room ', isEmoji: false },
      { text: '123', isEmoji: true },
    ])
  })
})
