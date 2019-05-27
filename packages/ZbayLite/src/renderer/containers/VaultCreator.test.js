/* eslint import/first: 0 */
jest.mock('../vault')
import { mapDispatchToProps } from './VaultCreator'

describe('VaultCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
