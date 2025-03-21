import { emojify } from './emojiCodes'

// TODO: add cursor offsets to these examples, and make sure the cursor is in the right place after the replacement

describe('Emoji code replacer', () => {
  it('Should replace shortcodes with emojis', () => {
    expect(emojify('Hello :smile: world', 14)).toStrictEqual({ text: 'Hello 😄 world', cursorOffset: -5 })
    expect(emojify(':heart: is a heart', 3)).toStrictEqual({ text: ':heart: is a heart', cursorOffset: 0 })
    expect(emojify('Multiple: :fire: :rocket: :tada:', 32)).toStrictEqual({
      text: 'Multiple: :fire: :rocket: 🎉',
      cursorOffset: -4,
    })
    expect(emojify(':p', 2)).toStrictEqual({ text: ':p', cursorOffset: 0 }) // don't convert until followed by space or punctuation
    expect(emojify(':p ', 3)).toStrictEqual({ text: '😛 ', cursorOffset: -1 }) // convert once followed by space
    expect(emojify(':p.', 3)).toStrictEqual({ text: '😛.', cursorOffset: -1 }) // convert once followed by punctuation
  })
})

// make all of these tests match the example above, with the cursor offset and cursor positions and signatures. choose cursor positions to expose potential issues and differences in behavior. feel free to write your own tests too.
/*
  
  it('Should handle emoticons at end of message differently for sending vs typing', () => {
    // When typing, emoticons without space or puncuation should not convert
    expect(emojify('<3')).toBe('<3');
    
    // When sending, emoticons preceeded by a space and at the end should convert
    expect(emojify('<3', true)).toBe('❤️');
    
    // When typing with a space after, the emoticon should convert
    expect(emojify(':) ')).toBe('🙂 ');
  })

  it('Should handle mixed emoji codes and regular text', () => {
    expect(emojify('I :heart: coding and I am :) about it!')).toBe('I ❤️ coding and I am 🙂 about it!')
    expect(emojify("Let's :tada: and be :D")).toBe("Let's 🎉 and be 😀")
  })

  it('Should not replace emoticons that are part of words', () => {
      expect(emojify('example:) is not an emoji')).toBe('example:) is not an emoji')
      expect(emojify('someone@example.com :)')).toBe('someone@example.com 🙂')
      expect(emojify('f(n) = x')).toBe('f(n) = x')
      expect(emojify('2<3 means 2 is less than 3')).toBe('2<3 means 2 is less than 3')
      expect(emojify('a<3b should not convert to emoji')).toBe('a<3b should not convert to emoji')
  })

  it('Should handle multiple of the same emoji code', () => {
    expect(emojify(':smile: :smile: :smile:')).toBe('😄 😄 😄')
    expect(emojify(':) :) :) Hello')).toBe('🙂 🙂 🙂 Hello')
  })

  it('Should not affect text without emoji codes', () => {
    expect(emojify('Regular text with no emojis')).toBe('Regular text with no emojis')
    expect(emojify('Text with : character but no emoji')).toBe('Text with : character but no emoji')
  })
    
  it('Should not apply inside code snippets', () => {
    expect(emojify("```<3``` <3")).toBe("```<3``` ❤️")
    expect(emojify("```<3``` <3 ")).toBe("```<3``` ❤️ ")
    expect(emojify("```<3``` <3 ```<3``` <3 ")).toBe("```<3``` ❤️ ```<3``` ❤️ ")
    expect(emojify("<3 ```<3```")).toBe("❤️ ```<3```")
    expect(emojify("```\nfunction() {\n  console.log(':smile: <3 :)')\n}```")).toBe("```\nfunction() {\n  console.log(':smile: <3 :)')\n}```")
    expect(emojify("Regular text :heart: with ```code <3 block``` and more :smile: text")).toBe("Regular text ❤️ with ```code <3 block``` and more 😄 text")
    expect(emojify("Inline code `console.log(':heart:')` should not convert :heart:")).toBe("Inline code `console.log(':heart:')` should not convert ❤️")
    expect(emojify("Text with `:heart:` in backticks and real :heart: emoji")).toBe("Text with `:heart:` in backticks and real ❤️ emoji")
    expect(emojify("Mixed ```code <3 and :smile: block``` with :) outside")).toBe("Mixed ```code <3 and :smile: block``` with 🙂 outside")
    expect(emojify("`const code = 'test'` <3")).toBe("`const code = 'test'` ❤️")
  })

  it('Should work for multi-line messages', () => {
    expect(emojify('First line :smile:\nSecond line :)\nThird line <3')).toBe('First line 😄\nSecond line 🙂\nThird line ❤️')
    expect(emojify('Emoticons on\nmultiple lines\n:D :) ;)')).toBe('Emoticons on\nmultiple lines\n😀 🙂 😉')
    expect(emojify('Text with\nURL: http://example.com\nand :heart: emoji')).toBe('Text with\nURL: http://example.com\nand ❤️ emoji')
  })

  
  it('Should not convert file paths', () => {
    expect(emojify('C:\\User\\Documents')).toBe('C:\\User\\Documents')
    expect(emojify('/home/user/file.txt')).toBe('/home/user/file.txt')
  })
  
  it('Should not convert normal parentheses usage', () => {
    expect(emojify('This is important (really).')).toBe('This is important (really).')
    expect(emojify('They are coming (I hope)!')).toBe('They are coming (I hope)!')
  })
  
  it('Should convert emoticons after URLs', () => {
    expect(emojify('Check http://example.org :)')).toBe('Check http://example.org 🙂')
    expect(emojify('Visit https://github.com/TryQuiet/quiet :D')).toBe('Visit https://github.com/TryQuiet/quiet 😀')
    expect(emojify('Documentation at http://docs.example.com :) is helpful')).toBe('Documentation at http://docs.example.com 🙂 is helpful')
  })


describe('replaceLastWordBeforeCursorWithEmojiIfUnprotected - Emoji replacement while typing', () => {
  it('Should replace shortcode with emoji when typing closing colon', () => {
    const text = 'Hello :smile:'
    const cursorPosition = text.length
    
    const result = emojify(text, cursorPosition)
    
    expect(result.text).toBe('Hello 😄')
    expect(result.cursorOffset).toBe(-5) // ':smile:' (7 chars) -> '😄' (2 chars) = offset -5
  })
  
  it('Should not replace incomplete shortcode', () => {
    const text = 'Hello :smile'
    const cursorPosition = text.length
    
    const result = emojify(text, cursorPosition)
    
    expect(result.text).toBe('Hello :smile')
    expect(result.cursorOffset).toBe(0)
  })
  
  it('Should replace emoticon with emoji when typing space after it', () => {
    const text = 'Hello :) '
    const cursorPosition = text.length
    
    const result = emojify(text, cursorPosition)
    
    expect(result.text).toBe('Hello 🙂 ')
    expect(result.cursorOffset).toBe(0) // No cursor offset after replacement
  })
  
  it('Should replace heart emoticon when typing space after it', () => {
    const text = 'I <3 '
    const cursorPosition = text.length
    
    const result = emojify(text, cursorPosition)
    
    expect(result.text).toBe('I ❤️ ')
    expect(result.cursorOffset).toBe(0)
  })
  
  it('Should not replace emoticon without space after it', () => {
    const text = 'Hello:)'
    const cursorPosition = text.length
    
    const result = emojify(text, cursorPosition)
    
    expect(result.text).toBe('Hello:)')
    expect(result.cursorOffset).toBe(0)
  })
  
  it('Should not convert emoticon in code blocks', () => {
    const text = '```<3``` <3 '
    const cursorPosition = text.length
    
    const result = emojify(text, cursorPosition)
    
    expect(result.text).toBe('```<3``` ❤️ ')
    expect(result.cursorOffset).toBe(0)
  })
})

describe('replaceAllEmojisInMessageIfUnprotected - Emoji replacement on message send', () => {
  it('Should handle emoticon at end of message without space', () => {
    expect(emojifyLastWordBeforeSending('Hello :)')).toBe('Hello 🙂')
    expect(emojifyLastWordBeforeSending('I love coding<3')).toBe('I love coding❤️')
    expect(emojifyLastWordBeforeSending('Great:D')).toBe('Great😀')
  })
  
  it('Should handle shortcode at end of message', () => {
    expect(emojifyLastWordBeforeSending('I love coding :heart:')).toBe('I love coding ❤️')
    expect(emojifyLastWordBeforeSending('Celebrate :tada:')).toBe('Celebrate 🎉')
  })
  
  it('Should not convert emoticons in protected regions', () => {
    expect(emojifyLastWordBeforeSending('```<3```')).toBe('```<3```')
    expect(emojifyLastWordBeforeSending('`<3`')).toBe('`<3`')
    expect(emojifyLastWordBeforeSending('```code block with :) inside```')).toBe('```code block with :) inside```')
  })
  
  it('Should convert emoticon after protected region', () => {
    expect(emojifyLastWordBeforeSending('```<3``` <3')).toBe('```<3``` ❤️')
    expect(emojifyLastWordBeforeSending('`code` :)')).toBe('`code` 🙂')
  })
  
  it('Should not convert emoticon in URL', () => {
    expect(emojifyLastWordBeforeSending('http://example.com/:)')).toBe('http://example.com/:)')
    expect(emojifyLastWordBeforeSending('Check out http://example.com/<3')).toBe('Check out http://example.com/<3')
  })
  
  it('Should handle emoticon after URL', () => {
    expect(emojifyLastWordBeforeSending('http://example.com/ :)')).toBe('http://example.com/ 🙂')
  })
  
  it('Should not convert math expressions', () => {
    expect(emojifyLastWordBeforeSending('2<3')).toBe('2<3')
    expect(emojifyLastWordBeforeSending('if (x<3)')).toBe('if (x<3)')
  })
})

// Tests for replaceAllEmojisInMessageIfUnprotected are already covered above

*/
