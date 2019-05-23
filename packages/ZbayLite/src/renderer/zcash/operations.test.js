import operationsFactory from './operations'

describe('operations', () => {
  const operationStatus = {
    id: 'test-operation-id',
    status: 'success',
    creation_time: 1558434676,
    result: {
      txid: 'test-tx-id'
    },
    execution_secs: 2.786471262,
    method: 'z_sendmany',
    params: {
      fromaddress: 'ztestsapling1testaddress',
      amounts: [
        { address: 'ztestsapling1testtargetaddress', amount: '0.0001' }
      ],
      minconf: 1,
      fee: 0.0001
    }
  }

  const getOperationStatusMock = jest.fn(async (opIds) => (
    opIds[0] === operationStatus.id
      ? [operationStatus]
      : undefined
  ))

  const zcashClient = {
    request: {
      'z_getoperationstatus': getOperationStatusMock
    }
  }

  const operations = operationsFactory(zcashClient)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('- getStatus fetches status for the operation', async () => {
    const opStatusResult = await operations.getStatus('test-operation-id')
    expect(opStatusResult).toEqual(operationStatus)
  })
})
