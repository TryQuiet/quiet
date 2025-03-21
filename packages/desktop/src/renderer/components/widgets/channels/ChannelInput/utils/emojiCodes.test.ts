import { 
  replaceLastWordBeforeCursorWithEmojiIfUnprotected,
  replaceLastEmoji
} from './emojiCodes'


// TODO: add cursor offsets to these examples, and make sure the cursor is in the right place after the replacement

describe('Emoji code replacer', () => {
  it('Should replace shortcodes with emojis', () => {
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('Hello :smile: world')).toBe('Hello 😄 world')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected(':heart: is a heart')).toBe('❤️ is a heart')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('Multiple: :fire: :rocket: :tada:')).toBe('Multiple: 🔥 🚀 🎉')
  })

  it('Should replace emoticons with emojis', () => {
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('Hello :) world')).toBe('Hello 🙂 world')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('That was funny :D')).toBe('That was funny 😀')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('Wink ;)')).toBe('Wink 😉')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('<3 ')).toBe('❤️ ')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('I <3 coding')).toBe('I ❤️ coding')
  })
  
  it('Should handle emoticons at end of message differently for sending vs typing', () => {
    // When typing, emoticons without space or puncuation should not convert
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('<3')).toBe('<3');
    
    // When sending, emoticons preceeded by a space and at the end should convert
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('<3', true)).toBe('❤️');
    
    // When typing with a space after, the emoticon should convert
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected(':) ')).toBe('🙂 ');
  })

  it('Should handle mixed emoji codes and regular text', () => {
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('I :heart: coding and I am :) about it!')).toBe('I ❤️ coding and I am 🙂 about it!')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected("Let's :tada: and be :D")).toBe("Let's 🎉 and be 😀")
  })

  it('Should not replace emoticons that are part of words', () => {
      expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('example:) is not an emoji')).toBe('example:) is not an emoji')
      expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('someone@example.com :)')).toBe('someone@example.com 🙂')
      expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('f(n) = x')).toBe('f(n) = x')
      expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('2<3 means 2 is less than 3')).toBe('2<3 means 2 is less than 3')
      expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('a<3b should not convert to emoji')).toBe('a<3b should not convert to emoji')
  })

  it('Should handle multiple of the same emoji code', () => {
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected(':smile: :smile: :smile:')).toBe('😄 😄 😄')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected(':) :) :) Hello')).toBe('🙂 🙂 🙂 Hello')
  })

  it('Should not affect text without emoji codes', () => {
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('Regular text with no emojis')).toBe('Regular text with no emojis')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('Text with : character but no emoji')).toBe('Text with : character but no emoji')
  })
    
  it('Should not apply inside code snippets', () => {
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected("```<3``` <3")).toBe("```<3``` ❤️")
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected("```<3``` <3 ")).toBe("```<3``` ❤️ ")
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected("```<3``` <3 ```<3``` <3 ")).toBe("```<3``` ❤️ ```<3``` ❤️ ")
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected("<3 ```<3```")).toBe("❤️ ```<3```")
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected("```\nfunction() {\n  console.log(':smile: <3 :)')\n}```")).toBe("```\nfunction() {\n  console.log(':smile: <3 :)')\n}```")
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected("Regular text :heart: with ```code <3 block``` and more :smile: text")).toBe("Regular text ❤️ with ```code <3 block``` and more 😄 text")
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected("Inline code `console.log(':heart:')` should not convert :heart:")).toBe("Inline code `console.log(':heart:')` should not convert ❤️")
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected("Text with `:heart:` in backticks and real :heart: emoji")).toBe("Text with `:heart:` in backticks and real ❤️ emoji")
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected("Mixed ```code <3 and :smile: block``` with :) outside")).toBe("Mixed ```code <3 and :smile: block``` with 🙂 outside")
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected("`const code = 'test'` <3")).toBe("`const code = 'test'` ❤️")
  })

  it('Should work for multi-line messages', () => {
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('First line :smile:\nSecond line :)\nThird line <3')).toBe('First line 😄\nSecond line 🙂\nThird line ❤️')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('Emoticons on\nmultiple lines\n:D :) ;)')).toBe('Emoticons on\nmultiple lines\n😀 🙂 😉')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('Text with\nURL: http://example.com\nand :heart: emoji')).toBe('Text with\nURL: http://example.com\nand ❤️ emoji')
  })

  
  it('Should not convert file paths', () => {
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('C:\\User\\Documents')).toBe('C:\\User\\Documents')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('/home/user/file.txt')).toBe('/home/user/file.txt')
  })
  
  it('Should not convert normal parentheses usage', () => {
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('This is important (really).')).toBe('This is important (really).')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('They are coming (I hope)!')).toBe('They are coming (I hope)!')
  })
  
  it('Should convert emoticons after URLs', () => {
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('Check http://example.org :)')).toBe('Check http://example.org 🙂')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('Visit https://github.com/TryQuiet/quiet :D')).toBe('Visit https://github.com/TryQuiet/quiet 😀')
    expect(replaceLastWordBeforeCursorWithEmojiIfUnprotected('Documentation at http://docs.example.com :) is helpful')).toBe('Documentation at http://docs.example.com 🙂 is helpful')
  })


describe('replaceLastWordBeforeCursorWithEmojiIfUnprotected - Emoji replacement while typing', () => {
  it('Should replace shortcode with emoji when typing closing colon', () => {
    const text = 'Hello :smile:'
    const cursorPosition = text.length
    
    const result = replaceLastWordBeforeCursorWithEmojiIfUnprotected(text, cursorPosition)
    
    expect(result.text).toBe('Hello 😄')
    expect(result.cursorOffset).toBe(-5) // ':smile:' (7 chars) -> '😄' (2 chars) = offset -5
  })
  
  it('Should not replace incomplete shortcode', () => {
    const text = 'Hello :smile'
    const cursorPosition = text.length
    
    const result = replaceLastWordBeforeCursorWithEmojiIfUnprotected(text, cursorPosition)
    
    expect(result.text).toBe('Hello :smile')
    expect(result.cursorOffset).toBe(0)
  })
  
  it('Should replace emoticon with emoji when typing space after it', () => {
    const text = 'Hello :) '
    const cursorPosition = text.length
    
    const result = replaceLastWordBeforeCursorWithEmojiIfUnprotected(text, cursorPosition)
    
    expect(result.text).toBe('Hello 🙂 ')
    expect(result.cursorOffset).toBe(0) // No cursor offset after replacement
  })
  
  it('Should replace heart emoticon when typing space after it', () => {
    const text = 'I <3 '
    const cursorPosition = text.length
    
    const result = replaceLastWordBeforeCursorWithEmojiIfUnprotected(text, cursorPosition)
    
    expect(result.text).toBe('I ❤️ ')
    expect(result.cursorOffset).toBe(0)
  })
  
  it('Should not replace emoticon without space after it', () => {
    const text = 'Hello:)'
    const cursorPosition = text.length
    
    const result = replaceLastWordBeforeCursorWithEmojiIfUnprotected(text, cursorPosition)
    
    expect(result.text).toBe('Hello:)')
    expect(result.cursorOffset).toBe(0)
  })
  
  it('Should not convert emoticon in code blocks', () => {
    const text = '```<3``` <3 '
    const cursorPosition = text.length
    
    const result = replaceLastWordBeforeCursorWithEmojiIfUnprotected(text, cursorPosition)
    
    expect(result.text).toBe('```<3``` ❤️ ')
    expect(result.cursorOffset).toBe(0)
  })
})

describe('replaceAllEmojisInMessageIfUnprotected - Emoji replacement on message send', () => {
  it('Should handle emoticon at end of message without space', () => {
    expect(replaceAllEmojisInMessageIfUnprotected('Hello :)')).toBe('Hello 🙂')
    expect(replaceAllEmojisInMessageIfUnprotected('I love coding<3')).toBe('I love coding❤️')
    expect(replaceAllEmojisInMessageIfUnprotected('Great:D')).toBe('Great😀')
  })
  
  it('Should handle shortcode at end of message', () => {
    expect(replaceAllEmojisInMessageIfUnprotected('I love coding :heart:')).toBe('I love coding ❤️')
    expect(replaceAllEmojisInMessageIfUnprotected('Celebrate :tada:')).toBe('Celebrate 🎉')
  })
  
  it('Should not convert emoticons in protected regions', () => {
    expect(replaceAllEmojisInMessageIfUnprotected('```<3```')).toBe('```<3```')
    expect(replaceAllEmojisInMessageIfUnprotected('`<3`')).toBe('`<3`')
    expect(replaceAllEmojisInMessageIfUnprotected('```code block with :) inside```')).toBe('```code block with :) inside```')
  })
  
  it('Should convert emoticon after protected region', () => {
    expect(replaceAllEmojisInMessageIfUnprotected('```<3``` <3')).toBe('```<3``` ❤️')
    expect(replaceAllEmojisInMessageIfUnprotected('`code` :)')).toBe('`code` 🙂')
  })
  
  it('Should not convert emoticon in URL', () => {
    expect(replaceAllEmojisInMessageIfUnprotected('http://example.com/:)')).toBe('http://example.com/:)')
    expect(replaceAllEmojisInMessageIfUnprotected('Check out http://example.com/<3')).toBe('Check out http://example.com/<3')
  })
  
  it('Should handle emoticon after URL', () => {
    expect(replaceAllEmojisInMessageIfUnprotected('http://example.com/ :)')).toBe('http://example.com/ 🙂')
  })
  
  it('Should not convert math expressions', () => {
    expect(replaceAllEmojisInMessageIfUnprotected('2<3')).toBe('2<3')
    expect(replaceAllEmojisInMessageIfUnprotected('if (x<3)')).toBe('if (x<3)')
  })
})

// TODO: Add tests for replaceLastEmoji that will be used when we send a message
