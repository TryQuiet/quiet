/* eslint import/first: 0 */
import Immutable from 'immutable'

import handlers, { Invitation, initialState } from './invitation'
import selectors from '../selectors/invitation'
import create from '../create'

describe('criticalError reducer', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        invitation: Invitation()
      })
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

    it('resetInvitation', () => {
      store.dispatch(handlers.actions.setAffiliateCode(true))
      store.dispatch(handlers.actions.setInvitationAmount(2))
      store.dispatch(handlers.actions.resetInvitation())

      expect(selectors.invitation(store.getState())).toEqual(initialState)
    })
  })
})
