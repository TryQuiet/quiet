import BigNumber from 'bignumber.js'

import accountingFactory from './accounting'

describe('accounting', () => {
  const zcashClient = {
    request: {
      'z_getbalance': jest.fn(async (address) => 2.432)
    }
  }

  const accounting = accountingFactory(zcashClient)

  it('fetches address balance', async () => {
    const address = 'testaddress'
    const balance = await accounting.balance(address)
    expect(balance).toBeInstanceOf(BigNumber)
    expect(balance).toMatchSnapshot()
    expect(zcashClient.request.z_getbalance).toHaveBeenCalledWith(address)
  })
})
