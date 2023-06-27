import { parseName } from './naming'

describe('Naming policy utility functions', () => {
  it.each([
    ['double-hyp--hens', 'double-hyp-hens'],
    ['-start-with-hyphen', 'start-with-hyphen'],
    [' start-with-space', 'start-with-space'],
    ['end-with-hyphen-', 'end-with-hyphen'],
    ['end-with-space ', 'end-with-space'],
    ['UpperCaseToLowerCase', 'uppercasetolowercase'],
    ['spaces to hyphens', 'spaces-to-hyphens'],
  ])('name "%s" gets corrected to "%s"', async (name: string, corrected: string) => {
    expect(parseName(name)).toEqual(corrected)
  })
})
