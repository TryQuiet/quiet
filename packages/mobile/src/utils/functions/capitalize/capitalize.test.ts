import { capitalize } from './capitalize'

describe('Capitalize first letter', () => {
  it('name "rockets" gets capitalized to "Rockets"', () => {
    expect(capitalize('rockets')).toEqual('Rockets')
  })

  it("doesn't break if provided empty string", () => {
    expect(capitalize('')).toEqual(null)
  })

  it("doesn't break if provided value is undefined", () => {
    expect(capitalize(undefined)).toEqual(null)
  })
})
