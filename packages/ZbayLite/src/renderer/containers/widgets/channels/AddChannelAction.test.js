/* eslint import/first: 0 */
import { mapDispatchToProps } from './AddChannelAction'

describe('AddChannelAction', () => {
  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
