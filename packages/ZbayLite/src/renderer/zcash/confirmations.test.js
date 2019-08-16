import confirmationsFactory from './confirmations'

describe('confirmations', () => {
  const transactionStatus = {
    amount: 0,
    confirmations: 0,
    time: 1558434676,
    timereceived: 1558434904,
    hex: 'test-hex',
    txid: 'test-tx-id',
    details: []
  }

  const getTransactionStatusMock = jest.fn(async (txId) => (
    txId === transactionStatus.txid
      ? transactionStatus
      : undefined
  ))

  const zcashClient = {
    request: {
      'gettransaction': getTransactionStatusMock
    }
  }

  const confirmations = confirmationsFactory(zcashClient)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('- getRtatus return status for the transaction', async () => {
    const transactionResult = await confirmations.getResult('test-tx-id')
    expect(transactionResult).toEqual(transactionStatus)
  })
})
