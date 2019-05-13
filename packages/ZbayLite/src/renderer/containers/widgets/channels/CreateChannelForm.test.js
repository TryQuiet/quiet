/* eslint import/first: 0 */
import { mapDispatchToProps } from './CreateChannelForm'

describe('CreateChannelForm', () => {
  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
