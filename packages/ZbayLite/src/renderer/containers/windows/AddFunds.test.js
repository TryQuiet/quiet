/* eslint import/first: 0 */
jest.mock('../../vault')

import { mapDispatchToProps } from './AddFunds'

describe('CreateVault', () => {
  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
