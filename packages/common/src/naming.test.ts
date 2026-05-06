import { parseName } from './naming'

describe('Naming policy utility functions', () => {
  it.each([
    ['---', '---'],
    [' ', '-'],
    ['UPPERCASE', 'uppercase'],
    ['lowercase', 'lowercase'],
    ['!@#$%^&*()', '----------'],
  ])('name "%s" gets corrected to "%s"', async (name: string, corrected: string) => {
    expect(parseName(name)).toEqual(corrected)
  })
})
