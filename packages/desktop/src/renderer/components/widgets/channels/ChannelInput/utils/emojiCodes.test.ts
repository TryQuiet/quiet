import { emojify } from './emojiCodes'

describe('Emoji code replacer', () => {
  it('Should replace shortcodes with emojis (while typing)', () => {
    // Pass a cursor position so we treat it like "typing" scenario
    expect(emojify('Hello :smile: world', 14)).toStrictEqual({
      text: 'Hello 😄 world',
      cursorOffset: -5,
    })
    expect(emojify(':heart: is a heart', 3)).toStrictEqual({
      text: ':heart: is a heart',
      cursorOffset: 0,
    })
    expect(emojify('Multiple: :fire: :rocket: :tada:', 32)).toStrictEqual({
      text: 'Multiple: :fire: :rocket: 🎉',
      cursorOffset: -4,
    })
    expect(emojify(':p', 2)).toStrictEqual({
      text: ':p',
      cursorOffset: 0,
    }) // no trailing delimiter => doesn't convert
    expect(emojify(':p ', 3)).toStrictEqual({
      text: '😛 ',
      cursorOffset: -1,
    }) // trailing space => convert
    expect(emojify(':p.', 3)).toStrictEqual({
      text: '😛.',
      cursorOffset: -1,
    }) // trailing punctuation => convert
  })
})

describe('Emoticons at end of message: typing vs. send', () => {
  it('Should handle emoticons differently depending on trailing delimiter', () => {
    // While typing, with no trailing delimiter, no conversion
    expect(emojify('<3', '<3'.length)).toStrictEqual({ text: '<3', cursorOffset: 0 })
    // On send, treat it as complete and convert
    expect(emojify('<3', { finalSend: true })).toBe('❤️')

    // While typing, trailing space => convert
    expect(emojify(':) ', 3)).toStrictEqual({ text: '🙂 ', cursorOffset: -1 })
    // On send, same input also yields a converted string
    expect(emojify(':) ', { finalSend: true })).toBe('🙂 ')
  })
})

describe('Should not replace emoticons that are part of words (on send)', () => {
  it('Examples where emoticons appear within other text', () => {
    expect(emojify('example:) is not an emoji', { finalSend: true })).toBe('example:) is not an emoji')
    expect(emojify('someone@example.com :)', { finalSend: true })).toBe('someone@example.com 🙂')
    expect(emojify('f(n) = x', { finalSend: true })).toBe('f(n) = x')
    expect(emojify('2<3 means 2 is less than 3', { finalSend: true })).toBe('2<3 means 2 is less than 3')
    expect(emojify('a<3b should not convert to emoji', { finalSend: true })).toBe('a<3b should not convert to emoji')
  })
})

describe('Multiple instances (on send)', () => {
  it('Should handle repeating codes/emoticons', () => {
    expect(emojify(':smile: :smile: :smile:', { finalSend: true })).toBe('😄 😄 😄')
    expect(emojify(':) :) :) Hello', { finalSend: true })).toBe('🙂 🙂 🙂 Hello')
  })
})

describe('No emoji codes present (on send)', () => {
  it('Should not change text without known shortcodes/emoticons', () => {
    expect(emojify('Regular text with no emojis', { finalSend: true })).toBe('Regular text with no emojis')
    expect(emojify('Text with : character but no emoji', { finalSend: true })).toBe(
      'Text with : character but no emoji'
    )
  })
})

describe(`Code snippets or protected regions (while typing)`, () => {
  it('Should not apply inside code fences or inline code', () => {
    expect(emojify('```<3 ``` <3', 6)).toStrictEqual({
      text: '```<3 ``` <3',
      cursorOffset: 0,
    })
    expect(emojify('```<3 ', 6)).toStrictEqual({
      text: '```<3 ',
      cursorOffset: 0,
    })
  })
  it('Should emojify outside code fences if it would otherwise', () => {
    expect(emojify('```<3 ``` <3 ', 13)).toStrictEqual({
      text: '```<3 ``` ❤️ ',
      cursorOffset: -1,
    })
  })
})

describe('Code snippets or protected regions (on send)', () => {
  it('Should not apply inside latex math blocks', () => {
    expect(emojify('$$<3$$ <3', { finalSend: true })).toBe('$$<3$$ ❤️')
    expect(emojify('$$<3$$ <3 ', { finalSend: true })).toBe('$$<3$$ ❤️ ')
    expect(emojify('$$ <3 ', 6)).toStrictEqual({ text: '$$ <3 ', cursorOffset: 0 })
  })
  it('Should not apply inside code fences or inline code', () => {
    expect(emojify('```<3``` <3', { finalSend: true })).toBe('```<3``` ❤️')
    expect(emojify('```<3``` <3 ', { finalSend: true })).toBe('```<3``` ❤️ ')
    expect(emojify('```<3``` <3 ```<3``` <3 ', { finalSend: true })).toBe('```<3``` ❤️ ```<3``` ❤️ ')
    expect(emojify('<3 ```<3```', { finalSend: true })).toBe('❤️ ```<3```')
    expect(emojify("```\nfunction() { console.log(':smile: <3 :)')}\n```", { finalSend: true })).toBe(
      "```\nfunction() { console.log(':smile: <3 :)')}\n```"
    )

    expect(emojify('Regular text :heart: with ```code <3 block``` and more :smile: text', { finalSend: true })).toBe(
      'Regular text ❤️ with ```code <3 block``` and more 😄 text'
    )
    expect(emojify("Inline code `console.log(':heart:')` should not convert :heart:", { finalSend: true })).toBe(
      "Inline code `console.log(':heart:')` should not convert ❤️"
    )
    expect(emojify('Text with `:heart:` in backticks and real :heart: emoji', { finalSend: true })).toBe(
      'Text with `:heart:` in backticks and real ❤️ emoji'
    )
    expect(emojify('Mixed ```code <3 and :smile: block``` with :) outside', { finalSend: true })).toBe(
      'Mixed ```code <3 and :smile: block``` with 🙂 outside'
    )
    expect(emojify("`const code = 'test'` <3", { finalSend: true })).toBe("`const code = 'test'` ❤️")
  })
})

describe('Multi-line messages (on send)', () => {
  it('Should convert across line breaks', () => {
    expect(emojify('First line :smile:\nSecond line :)\nThird line <3', { finalSend: true })).toBe(
      'First line 😄\nSecond line 🙂\nThird line ❤️'
    )
    expect(emojify('Emoticons on\nmultiple lines\n:D :) ;)', { finalSend: true })).toBe(
      'Emoticons on\nmultiple lines\n😀 🙂 😉'
    )
    expect(emojify('Text with\nURL: http://example.com\nand :heart: emoji', { finalSend: true })).toBe(
      'Text with\nURL: http://example.com\nand ❤️ emoji'
    )
  })
})

describe('File paths or parentheses (on send)', () => {
  it('Should not convert file paths or normal parentheses usage', () => {
    expect(emojify('C:\\User\\Documents', { finalSend: true })).toBe('C:\\User\\Documents')
    expect(emojify('/home/user/file.txt', { finalSend: true })).toBe('/home/user/file.txt')
    expect(emojify('This is important (really).', { finalSend: true })).toBe('This is important (really).')
    expect(emojify('They are coming (I hope)!', { finalSend: true })).toBe('They are coming (I hope)!')
  })
})

describe('URLs (on send)', () => {
  it('Should convert emoticons after URLs, but not inside the URL', () => {
    expect(emojify('Check http://example.org :)', { finalSend: true })).toBe('Check http://example.org 🙂')
    expect(emojify('Visit https://github.com/TryQuiet/quiet :D', { finalSend: true })).toBe(
      'Visit https://github.com/TryQuiet/quiet 😀'
    )
    expect(emojify('Documentation at http://docs.example.com :) is helpful', { finalSend: true })).toBe(
      'Documentation at http://docs.example.com 🙂 is helpful'
    )

    // Should not convert inside the URL itself
    expect(emojify('http://example.com/:)', { finalSend: true })).toBe('http://example.com/:)')
    expect(emojify('Check out http://example.com/<3', { finalSend: true })).toBe('Check out http://example.com/<3')
  })
})

describe('Math expressions (on send)', () => {
  it('Should not convert expressions like 2<3 or x>10 inside text', () => {
    expect(emojify('2<3', { finalSend: true })).toBe('2<3')
    expect(emojify('if (x<3)', { finalSend: true })).toBe('if (x<3)')
  })
})
