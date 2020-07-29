
import { mapDispatchToProps } from './DirectMessagesMenuActions'

describe('DirectMessagesMenuActions', () => {
  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x, { history: 'test' })
    expect(actions).toMatchSnapshot()
  })
})
