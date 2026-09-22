import { hasEmoji, isAllEmoji, splitEmoji } from './emojis'

describe('Emoji Utilities', () => {
  it('Should detect an emoji in a string', () => {
    expect(hasEmoji('❤️‍🔥')).toBeTruthy()
    expect(hasEmoji('Hello ❤️‍🔥 Emoji')).toBeTruthy()
    expect(hasEmoji('No emoji :-(')).toBeFalsy()
  })

  it('Should not read digits, # or * as emoji', () => {
    // `\p{Emoji}` matches every keycap base, so anything built on it calls these emoji.
    expect(hasEmoji('86')).toBeFalsy()
    expect(hasEmoji('0123456789')).toBeFalsy()
    expect(hasEmoji('#general')).toBeFalsy()
    expect(hasEmoji('2 * 3')).toBeFalsy()
    expect(hasEmoji('Meet at 8')).toBeFalsy()

    expect(isAllEmoji('86')).toBeFalsy()
    expect(isAllEmoji('#')).toBeFalsy()
    expect(isAllEmoji('*')).toBeFalsy()
    expect(isAllEmoji('123')).toBeFalsy()
  })

  it('Should still read a full keycap sequence as emoji', () => {
    // A digit is only emoji with the keycap combining mark after it.
    expect(hasEmoji('1️⃣')).toBeTruthy()
    expect(isAllEmoji('1️⃣2️⃣3️⃣')).toBeTruthy()
    expect(isAllEmoji('#️⃣')).toBeTruthy()
    expect(isAllEmoji('86 1️⃣')).toBeFalsy()
  })

  it('Should detect when a string is all emojis (or spaces)', () => {
    expect(isAllEmoji('🙂🙂🙂🙂🙂🙂🙂🙂')).toBeTruthy()
    expect(isAllEmoji('🐈‍⬛❤️‍🔥🏴')).toBeTruthy()
    expect(isAllEmoji('🐈‍⬛ ❤️‍🔥 🏴')).toBeTruthy()
    expect(isAllEmoji('❤️‍🔥')).toBeTruthy()
    expect(isAllEmoji('🐈‍⬛')).toBeTruthy()
    expect(isAllEmoji('👍🏽')).toBeTruthy()
    expect(isAllEmoji('🇵🇱')).toBeTruthy()
    expect(isAllEmoji('🏴󠁧󠁢󠁳󠁣󠁴󠁿')).toBeTruthy()
    expect(isAllEmoji('❤️‍🔥 Emoji')).toBeFalsy()
    expect(isAllEmoji('Hello ❤️‍🔥')).toBeFalsy()
    expect(isAllEmoji('Hello ❤️‍🔥 Emoji')).toBeFalsy()
    expect(isAllEmoji('🐈‍⬛ (Not emoji) 🏴')).toBeFalsy()
    expect(isAllEmoji('No emoji :-(')).toBeFalsy()
  })

  it('Should not call a string with no emoji in it all emoji', () => {
    expect(isAllEmoji('')).toBeFalsy()
    expect(isAllEmoji('   ')).toBeFalsy()
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
  })

  it('Should leave digits, # and * in the text run when splitting', () => {
    // The regression this guards: every message with a number in it used to come back with the
    // digits in an emoji segment, and so rendered them at emoji size.
    expect(splitEmoji('86 is fine')).toEqual([{ text: '86 is fine', isEmoji: false }])
    expect(splitEmoji('Room 123')).toEqual([{ text: 'Room 123', isEmoji: false }])
    expect(splitEmoji('#general')).toEqual([{ text: '#general', isEmoji: false }])
    expect(splitEmoji('2 * 3 = 6')).toEqual([{ text: '2 * 3 = 6', isEmoji: false }])

    expect(splitEmoji('Room 123 🎉')).toEqual([
      { text: 'Room 123 ', isEmoji: false },
      { text: '🎉', isEmoji: true },
    ])
  })

  it('Should split multi-codepoint emoji as one segment', () => {
    expect(splitEmoji('on 1️⃣ today')).toEqual([
      { text: 'on ', isEmoji: false },
      { text: '1️⃣', isEmoji: true },
      { text: ' today', isEmoji: false },
    ])

    expect(splitEmoji('nice 👍🏽')).toEqual([
      { text: 'nice ', isEmoji: false },
      { text: '👍🏽', isEmoji: true },
    ])

    expect(splitEmoji('from 🇵🇱 with love')).toEqual([
      { text: 'from ', isEmoji: false },
      { text: '🇵🇱', isEmoji: true },
      { text: ' with love', isEmoji: false },
    ])

    expect(splitEmoji('go 🏴󠁧󠁢󠁳󠁣󠁴󠁿')).toEqual([
      { text: 'go ', isEmoji: false },
      { text: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', isEmoji: true },
    ])

    // Adjacent emoji stay one run, as they did before.
    expect(splitEmoji('yes 🎉🎉🎉')).toEqual([
      { text: 'yes ', isEmoji: false },
      { text: '🎉🎉🎉', isEmoji: true },
    ])

    // Different emoji, touching, are still one run.
    expect(splitEmoji('🎉🎊🥳')).toEqual([{ text: '🎉🎊🥳', isEmoji: true }])

    // A zero-width joiner holds a sequence together across its parts.
    expect(splitEmoji('the 👨‍👩‍👧‍👦 emoji')).toEqual([
      { text: 'the ', isEmoji: false },
      { text: '👨‍👩‍👧‍👦', isEmoji: true },
      { text: ' emoji', isEmoji: false },
    ])
  })
})
