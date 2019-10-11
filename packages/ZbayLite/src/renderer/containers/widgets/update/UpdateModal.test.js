/* eslint import/first: 0 */
import { mapDispatchToProps } from './UpdateModal'

describe('UpdateModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
