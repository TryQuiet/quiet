/* eslint import/first: 0 */
import BigNumber from 'bignumber.js'

import create from '../create'
import each from 'jest-each'
import { initialState } from '../handlers/identity'
import { Operation, OperationTypes, ShieldBalanceOp } from '../handlers/operations'
import selectors from './identity'

describe('identity selectors', () => {
  const transparentAddress = 't14oHp2v54vfmdgQ3v3SNuQga8JKHTNi2a1'
  const address = 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
  const signerPrivKey = Buffer.alloc(32)
  const signerPubKey = Buffer.alloc(32)
  const shippingData = {
    firstName: 'Saturn',
    lastName: 'the Planet',
    street: 'Coders Dv',
    country: 'Poland',
    region: 'Malopolska',
    city: 'Krakow',
    postalCode: '1337-455'
  }
  let store = null
  beforeEach(() => {
    store = create({
      identity: {
        ...initialState,
        data: {
          ...initialState.data,
          address,
          transparentAddress,
          name: 'Saturn',
          transparentBalance: '12.123456',
          balance: '33.583004',
          lockedBalance: '12.583004',
          shippingData: {
            ...initialState.data.shippingData,
            ...shippingData
          },
          signerPrivKey,
          signerPubKey,
          donationAllow: 'false',
          donationAddress: 'test'
        },
        loader: {
          message: 'Test loading message',
          loading: true
        }
      },
      rates: {
        zec: '1',
        usd: '2'
      },
      operations: {
        'test-operation-id': {
          ...Operation,
          opId: 'test-operation-id',
          type: OperationTypes.shieldBalance,
          meta: {
            ...ShieldBalanceOp,
            amount: new BigNumber('0.1234'),
            from: transparentAddress,
            to: address
          }
        },
        'test-operation-id-1': {
          ...Operation,
          opId: 'test-operation-id-1',
          type: 'not-shield-operation',
          meta: { name: 'test' }
        },
        'test-operation-id-2': {
          ...Operation,
          opId: 'test-operation-id-2',
          type: OperationTypes.shieldBalance,
          meta: {
            ...ShieldBalanceOp,
            amount: new BigNumber('0.2345'),
            from: transparentAddress,
            to: address
          }
        }
      }
    })
    jest.clearAllMocks()
  })

  it('identity', () => {
    expect(selectors.identity(store.getState())).toMatchSnapshot()
  })

  each(['usd', 'zec']).test('balance for %s', currency => {
    expect(selectors.balance(currency)(store.getState())).toMatchSnapshot()
  })

  it('address', () => {
    expect(selectors.address(store.getState())).toMatchSnapshot()
  })
  it('topShieldedAddress', () => {
    expect(selectors.topShieldedAddress(store.getState())).toMatchSnapshot()
  })
  it('topAddress', () => {
    expect(selectors.topAddress(store.getState())).toMatchSnapshot()
  })

  it('transparentAddress', () => {
    expect(selectors.transparentAddress(store.getState())).toMatchSnapshot()
  })

  each(['usd', 'zec']).test('lockedBalance for %s', currency => {
    expect(selectors.lockedBalance(currency)(store.getState())).toMatchSnapshot()
  })

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

  it('shippingData', () => {
    expect(selectors.shippingData(store.getState())).toMatchSnapshot()
  })

  it('donationAllow', () => {
    expect(selectors.donationAllow(store.getState())).toMatchSnapshot()
  })

  it('donationAddress', () => {
    expect(selectors.donationAddress(store.getState())).toMatchSnapshot()
  })
  it('donation', () => {
    expect(selectors.donation(store.getState())).toMatchSnapshot()
  })
})
