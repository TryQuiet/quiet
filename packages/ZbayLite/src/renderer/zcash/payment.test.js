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
  const sendMock = jest.fn()

  const zcashClient = {
    request: {
      z_listreceivedbyaddress: jest.fn(async (address) => received[address]),
      z_sendmany: sendMock,
      z_listunspent: jest.fn(async () => [{ key: 'value' }])
    }
  }

  const payment = paymentFactory(zcashClient)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('receives lists received by address', async () => {
    expect(payment.received(address)).resolves.toMatchSnapshot()
  })

  it('unspentNotes', async () => {
    await payment.unspentNotes({
      minConfirmations: 2,
      maxConfirmations: 5,
      includeWatchonly: true,
      addresses: ['test-addresss-1']
    })
    expect(zcashClient.request.z_listunspent.mock.calls).toMatchSnapshot()
  })

  describe('send', () => {
    it('returns operation id', async () => {
      sendMock.mockImplementation(async () => 'operation-id')
      const amounts = [
        {
          address,
          amount: '0.23',
          memo: 'test-memo'
        },
        {
          address,
          amount: '4.12',
          memo: 'test-memo-2'
        }
      ]
      expect(payment.send({ address, amounts })).resolves.toMatchSnapshot()
    })

    it('sends transfers', async () => {
      const from = 'zs1zxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      sendMock.mockImplementation(async () => 'operation-id')
      const amounts = [
        {
          address,
          amount: '0.23',
          memo: 'test-memo'
        },
        {
          address,
          amount: '4.12',
          memo: 'test-memo-2'
        }
      ]
      await payment.send({ from, amounts })
      expect(sendMock.mock.calls).toMatchSnapshot()
    })

    it('verifies amounts', async () => {
      sendMock.mockImplementation(async () => 'operation-id')
      const amounts = [
        {
          address,
          memo: 'test-memo'
        },
        {

          amount: '4.12',
          memo: 'test-memo'
        },
        {
          address,
          amount: '4.12'
        }
      ]
      expect(payment.send({ address, amounts })).rejects.toMatchSnapshot()
    })
  })
})
