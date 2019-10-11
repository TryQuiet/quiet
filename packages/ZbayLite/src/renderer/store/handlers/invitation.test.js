/* eslint import/first: 0 */
jest.mock('../../vault')
jest.mock('../../zcash')

import Immutable from 'immutable'

import handlers, { Invitation, initialState } from './invitation'
import selectors from '../selectors/invitation'
import create from '../create'
import { IdentityState, Identity } from './identity'
import { initialState as rates } from './rates'

describe('criticalError reducer', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        invitation: Invitation(),
        identity: IdentityState({
          data: Identity({ address: 'test-address' })
        }),
        rates: rates
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
  describe('handles epics -', () => {
    it('generateInvitation with money', async () => {
      store.dispatch(handlers.actions.setInvitationAmount(2))
      await store.dispatch(handlers.epics.generateInvitation())

      expect(selectors.generatedInvitation(store.getState())).toMatchSnapshot()
    })
    it('generateInvitation without money', async () => {
      await store.dispatch(handlers.epics.generateInvitation())

      expect(selectors.generatedInvitation(store.getState())).toMatchSnapshot()
    })
    it('handleInvitation', async () => {
      const invitationTest = `eJxtkEly3CAUQO+itbsKS4AguxyFYpJBYOCDGFK5ezp7n+ANfzbw268NtCy6vvSoOiqtXl7PV9VQPzPKuljXWcs55cSbcLRLelMpMRuS5wOv3tHTF5nn3QPqoSll3EXtIROiRWF5ZW7cbT04F4ybOp/MEzwywikelg4we0jX2v30BOQCcSApYjaM2sxDosBcmY437Htm8xkLsEQPMdTd9YGdGoA0Qnw8PDpaGAkXhYz3zNRxYhSSRm/bDnrZRdJpuRWcLVOJg2BLuJgNDD9GH92joqUIrZdG90r080xmBmXEqqssf9vu8+xt+9iEUkUDvNet/59ApPsr2s/jZKx104+z7tzNm7JRmNpdzsopNIzLaOciMctWw25OL+0BLnt3EqlSZ6GVdwbJuIc3RH1HUb++4++fYR4RHvfhFhEpNMybokMgi+/ZdVVo2bT2OjQfQFLbT+NcTKfk86le5rsvFM88yjXvGLe//wCr7b9b`
      await store.dispatch(handlers.epics.handleInvitation(invitationTest))

      expect(selectors.generatedInvitation(store.getState())).toMatchSnapshot()
    })
  })
})
