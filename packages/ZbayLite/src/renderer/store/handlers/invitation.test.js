/* eslint import/first: 0 */
jest.mock('../../zcash')

import handlers, { Invitation, initialState } from './invitation'
import selectors from '../selectors/invitation'
import create from '../create'
import { initialState as identity } from './identity'
import { initialState as rates } from './rates'

describe('criticalError reducer', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: {
        invitation: {
          ...Invitation
        },
        identity: {
          ...identity,
          data: {
            ...identity.data,
            address: 'test-address'
          }
        },
        rates: {
          ...rates
        }
      }
    })
    jest.clearAllMocks()
  })

  describe('handles actions -', () => {
    it('setInvitationAmount', () => {
      store.dispatch(handlers.actions.setInvitationAmount(2))

      expect(selectors.amount(store.getState())).toEqual(2)
    })

    it('setAffiliateCode', () => {
      store.dispatch(handlers.actions.setAffiliateCode(true))

      expect(selectors.affiliateCode(store.getState())).toEqual(true)
    })
    it('setGeneratedInvitation', () => {
      store.dispatch(handlers.actions.setGeneratedInvitation('zbay://testurl'))
      expect(selectors.generatedInvitation(store.getState())).toEqual('zbay://testurl')
    })

    it('resetInvitation', () => {
      store.dispatch(handlers.actions.setAffiliateCode(true))
      store.dispatch(handlers.actions.setInvitationAmount(2))
      store.dispatch(handlers.actions.resetInvitation())

      expect(selectors.invitation(store.getState())).toEqual(initialState)
    })
  })
})
