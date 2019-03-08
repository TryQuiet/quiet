import { mapDispatchToProps } from './WalletPanelActions'

describe('WalletPanelActions', () => {
  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
