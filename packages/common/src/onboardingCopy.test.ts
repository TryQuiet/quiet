import * as onboardingCopy from './onboardingCopy'

/** Acronyms and proper nouns allowed to keep a capital mid-sentence. */
const ALLOWED_CAPITALISED = new Set(['QR'])

const entries = Object.entries(onboardingCopy) as [string, string][]

/** Sentences, so a capital that opens a new one is not read as title case. */
const sentences = (text: string): string[] => text.split(/(?<=[.!?])\s+/).filter(s => s.length > 0)

/**
 * Words in one sentence that are capitalised where sentence case would not be.
 * The first word of the sentence is exempt, as is a word opening a quotation
 * (the Scan QR code intro names the “Link devices” screen) and any acronym.
 */
const wronglyCapitalised = (sentence: string): string[] =>
  sentence
    .split(/\s+/)
    .slice(1)
    .filter(token => !/^[“"']/.test(token))
    .map(token => token.replace(/[^A-Za-z]/g, ''))
    .filter(word => word.length > 0 && /^[A-Z]/.test(word) && !ALLOWED_CAPITALISED.has(word))

describe('onboarding copy', () => {
  it.each(entries)('%s is a non-empty, trimmed string', (_name, text) => {
    expect(typeof text).toBe('string')
    expect(text.length).toBeGreaterThan(0)
    expect(text).toBe(text.trim())
  })

  it.each(entries)('%s starts every sentence with a capital letter', (_name, text) => {
    for (const sentence of sentences(text)) {
      expect(sentence[0]).toBe(sentence[0].toUpperCase())
      expect(sentence[0]).not.toBe(sentence[0].toLowerCase())
    }
  })

  it.each(entries)('%s is sentence case, not title case', (_name, text) => {
    // The regression that started this module: the paste heading was written
    // "Paste a link to Join", copied from an unfinished Figma frame.
    expect(sentences(text).flatMap(wronglyCapitalised)).toEqual([])
  })

  it('rejects the title-cased spelling this module was created to stop', () => {
    expect(wronglyCapitalised('Paste a link to Join')).toEqual(['Join'])
    expect(wronglyCapitalised(onboardingCopy.PASTE_LINK_HEADING)).toEqual([])
    expect(onboardingCopy.PASTE_LINK_HEADING).toBe('Paste a link to join')
  })

  it('matches the copy the screens are built against', () => {
    expect(entries.map(([name, text]) => `${name}: ${text}`).sort()).toMatchSnapshot()
  })
})
