/* eslint import/first: 0 */
import Immutable from 'immutable'
import { DateTime } from 'luxon'

import { mapStateToProps } from './SentFundsModal'

import create from '../../store/create'

describe('SentFundsModal', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.fromJS({
        rates: {
          usd: '10',
          zec: '1'
        },
        modals: {
          payloads: {
            sentFunds: {
              recipient: 'test',
              amountZec: 10,
              amountUsd: 10,
              feeUsd: 0,
              feeZec: 0,
              memo: 'test memo',
              timestamp: DateTime.utc(2017).toSeconds()
            }
          }
        }
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
