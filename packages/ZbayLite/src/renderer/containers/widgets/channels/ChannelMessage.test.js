/* eslint import/first: 0 */
jest.mock('../../../vault')

import { mapDispatchToProps } from './ChannelMessage'

describe('ChannelMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
