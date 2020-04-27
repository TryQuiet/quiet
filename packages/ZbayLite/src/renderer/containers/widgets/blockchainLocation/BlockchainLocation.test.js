/* eslint import/first: 0 */
import { mapDispatchToProps } from './BlockchainLocation'

describe('BlockchainLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
