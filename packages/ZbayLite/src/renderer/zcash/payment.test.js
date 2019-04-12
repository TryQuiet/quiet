import paymentFactory from './payment'
import { createTransfer } from '../testUtils'

describe('payment', () => {
  const address = 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
  const received = {
    [address]: [
      createTransfer({ txid: 'test-1' }),
      createTransfer({ txid: 'test-2' })
    ]
  }

  const zcashClient = {
    request: {
      'z_listreceivedbyaddress': jest.fn(async (address) => received[address])
    }
  }

  const payment = paymentFactory(zcashClient)

  it('received lists received by address', async () => {
    expect(payment.received(address)).resolves.toMatchSnapshot()
  })
})
