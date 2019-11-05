/* eslint import/first: 0 */
jest.mock('../../zcash')
jest.mock('../../vault')

import Immutable from 'immutable'
import { DateTime } from 'luxon'
import * as R from 'ramda'

import create from '../create'
import { createArchive } from '../../vault/marshalling'
import vault, { mock as vaultMock } from '../../vault'
import testUtils from '../../testUtils'
import offersSelectors from '../selectors/offers'
import * as offersHandlers from './offers'
import { ReceivedMessage } from '../handlers/messages'
import { IdentityState, Identity } from './identity'

const identity1 = testUtils.identities[0]
const identityAddress = identity1.address
const identityId = 'identity-id-from-vault'

describe('Offers reducer', () => {
  let store = null
  const itemId = 'itemId'
  const initialState = {
    offers: Immutable.Map(),
    identity: IdentityState({
      data: Identity({
        id: identityId,
        address: identityAddress,
        transparentAddress: 'test-transparent-identity-address',
        name: 'Saturn',
        signerPrivKey: '879aff43df53606d8ae1219d9347360e7a30d1c2f141e14c9bc96bb29bf930cb'
      })
    })
  }
  beforeEach(async () => {
    jest.spyOn(DateTime, 'utc').mockImplementation(() => testUtils.now)
    store = create({
      initialState: Immutable.Map(initialState)
    })
  })
  describe('handles actions', () => {
    it('- addOffer', () => {
      const newOffer = new offersHandlers.Offer({
        address: 'offer.address',
        itemId: itemId,
        name: 'offer.name',
        lastSeen: 123
      })
      store.dispatch(offersHandlers.actions.addOffer({ newOffer }))
      expect(offersSelectors.offer(itemId)(store.getState())).toMatchSnapshot()
    })
    it('- setMessages', () => {
      const messages = Immutable.List(
        Immutable.fromJS(
          R.range(0, 4).map(id =>
            ReceivedMessage(
              testUtils.createReceivedMessage({
                id,
                createdAt: testUtils.now.minus({ hours: 2 * id }).toSeconds()
              })
            )
          )
        )
      )
      store.dispatch(offersHandlers.actions.setMessages({ messages, itemId: itemId }))
      expect(offersSelectors.offerMessages(itemId)(store.getState())).toMatchSnapshot()
    })
    it('- setLastSeen', () => {
      store.dispatch(
        offersHandlers.actions.setLastSeen({ lastSeen: testUtils.now, itemId: itemId })
      )
      expect(offersSelectors.lastSeen(itemId)(store.getState())).toEqual(testUtils.now)
    })
    it('- setNewMessages', () => {
      store.dispatch(offersHandlers.actions.appendNewMessages({ message: 'test', itemId: itemId }))
      expect(offersSelectors.offer(itemId)(store.getState()).newMessages).toMatchSnapshot()
    })
    it('- cleanNewMessages', () => {
      store.dispatch(offersHandlers.actions.appendNewMessages({ message: 'test', itemId: itemId }))
      expect(offersSelectors.offer(itemId)(store.getState()).newMessages).toMatchSnapshot()
      store.dispatch(offersHandlers.actions.cleanNewMessages({ itemId: itemId }))
      expect(offersSelectors.offer(itemId)(store.getState()).newMessages).toEqual(Immutable.List())
    })
  })

  describe('handles epics', () => {
    beforeEach(() => {
      vaultMock.setArchive(createArchive())
    })

    it('createOffer', async () => {
      const payload = {
        tag: 'tag',
        description: 'description',
        background: 'background',
        title: 'title',
        offerOwner: 'username',
        id: itemId,
        address: 'address'
      }
      const spy = jest
        .spyOn(offersHandlers, 'loadVaultContacts')
        .mockImplementation(() => async () => {})
      await store.dispatch(offersHandlers.epics.createOffer({ payload }))
      expect(spy).toHaveBeenCalled()
    })
    it('initMessage', async () => {
      const newOffer = new offersHandlers.Offer({
        address: 'offer.address',
        itemId: itemId,
        name: 'offer.name',
        lastSeen: 123
      })
      store.dispatch(offersHandlers.actions.addOffer({ newOffer }))
      vault.getVault.mockImplementationOnce(() => ({
        offers: {
          listMessages: jest.fn(async () => {
            return [testUtils.vaultTestMessages[0]]
          })
        }
      }))
      await store.dispatch(offersHandlers.epics.initMessage())
      expect(offersSelectors.offerMessages(itemId)(store.getState())).toMatchSnapshot()
    })
    it('refreshMessages', async () => {
      const newOffer = new offersHandlers.Offer({
        address: 'offer.address',
        itemId: itemId,
        name: 'offer.name',
        lastSeen: 123
      })
      store.dispatch(offersHandlers.actions.addOffer({ newOffer }))
      vault.getVault.mockImplementationOnce(() => ({
        offers: {
          listMessages: jest.fn(async () => {
            return testUtils.vaultTestMessages
          })
        }
      }))
      await store.dispatch(offersHandlers.epics.refreshMessages(itemId))
      expect(offersSelectors.offerMessages(itemId)(store.getState())).toMatchSnapshot()
    })
    it('update lastSeen', async () => {
      const newOffer = new offersHandlers.Offer({
        address: 'offer.address',
        itemId: itemId,
        name: 'offer.name',
        lastSeen: 123
      })
      store.dispatch(offersHandlers.actions.addOffer({ newOffer }))
      const mockLastSeen = vault.getVault.mockImplementationOnce(() => ({
        offers: {
          updateLastSeen: jest.fn(async () => {
          })
        }
      }))
      jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => testUtils.now)
      await store.dispatch(offersHandlers.epics.updateLastSeen({ itemId }))

      expect(offersSelectors.offer(itemId)(store.getState())).toMatchSnapshot()
      expect(mockLastSeen).toHaveBeenCalled()
    })
  })
})
