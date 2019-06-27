/* eslint import/first: 0 */
jest.mock('../../vault')

import { mapDispatchToProps } from './QuitAppDialog'

describe('QuitAppDialog', () => {
  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
