
import { mapDispatchToProps } from './DepositMoneyModal'

describe('DepositMoneyModal', () => {
  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
