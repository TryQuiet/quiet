import { capitalizeFirstLetter } from './capitalize'

describe('Capitalize first letter', () => {
  it('name "rockets" gets capitalized to "Rockets"', () => {
    expect(capitalizeFirstLetter('rockets')).toEqual('Rockets')
  })
})
