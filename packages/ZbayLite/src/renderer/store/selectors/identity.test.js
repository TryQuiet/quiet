/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'

import create from '../create'
import { IdentityState, Identity } from '../handlers/identity'
import { RatesState } from '../handlers/rates'
import { Operation, operationTypes, ShieldBalanceOp } from '../handlers/operations'
import { LoaderState } from '../handlers/utils'
import selectors from './identity'

describe('identity selectors', () => {
  const transparentAddress = 't14oHp2v54vfmdgQ3v3SNuQga8JKHTNi2a1'
  const address = 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
  const signerPrivKey = Buffer.alloc(32)
  const signerPubKey = Buffer.alloc(32)
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        identity: IdentityState({
          data: Identity({
            address,
            transparentAddress,
            name: 'Saturn',
            transparentBalance: '12.123456',
            balance: '33.583004',
            lockedBalance: '12.583004',
            signerPrivKey,
            signerPubKey
          }),
          loader: LoaderState({
            message: 'Test loading message',
            loading: true
          })
        }),
        rates: RatesState({
          zec: '1',
          usd: '2'
        }),
        operations: Immutable.Map({
          'test-operation-id': Operation({
            opId: 'test-operation-id',
            type: operationTypes.shieldBalance,
            meta: ShieldBalanceOp({
              amount: new BigNumber('0.1234'),
              from: transparentAddress,
              to: address
            })
          }),
          'test-operation-id-1': Operation({
            opId: 'test-operation-id-1',
            type: 'not-shield-operation',
            meta: { name: 'test' }
          }),
          'test-operation-id-2': Operation({
            opId: 'test-operation-id-2',
            type: operationTypes.shieldBalance,
            meta: ShieldBalanceOp({
              amount: new BigNumber('0.2345'),
              from: transparentAddress,
              to: address
            })
          })
        })
      })
    })
    jest.clearAllMocks()
  })

  it('identity', () => {
    expect(selectors.identity(store.getState())).toMatchSnapshot()
  })

  each(['usd', 'zec']).test(
    'balance for %s',
    (currency) => {
      expect(selectors.balance(currency)(store.getState())).toMatchSnapshot()
    }
  )

  it('address', () => {
    expect(selectors.address(store.getState())).toMatchSnapshot()
  })

  it('transparentAddress', () => {
    expect(selectors.transparentAddress(store.getState())).toMatchSnapshot()
  })

  it('transparentBalance', () => {
    expect(selectors.transparentBalance(store.getState())).toMatchSnapshot()
  })

  each(['usd', 'zec']).test(
    'lockedBalance for %s',
    (currency) => {
      expect(selectors.lockedBalance(currency)(store.getState())).toMatchSnapshot()
    }
  )

  it('data', () => {
    expect(selectors.data(store.getState())).toMatchSnapshot()
  })

  it('loader', () => {
    expect(selectors.loader(store.getState())).toMatchSnapshot()
  })

  it('signerPrivKey', () => {
    expect(selectors.signerPrivKey(store.getState())).toMatchSnapshot()
  })

  it('signerPubKey', () => {
    expect(selectors.signerPubKey(store.getState())).toMatchSnapshot()
  })
})
