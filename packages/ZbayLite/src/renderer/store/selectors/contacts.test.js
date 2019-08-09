/* eslint import/first: 0 */
import Immutable from 'immutable'
import * as R from 'ramda'

import create from '../create'
import selectors, { Contact } from './contacts'
import testUtils from '../../testUtils'
import { ReceivedMessage } from '../handlers/messages'

describe('operations selectors', () => {
  const [identity1, identity2] = testUtils.identities
  const messages = Immutable.List(
    R.range(0, 2).map(id => ReceivedMessage(
      testUtils.messages.createReceivedMessage({
        id,
        createdAt: testUtils.now.minus({ hours: 2 * id }).toSeconds(),
        sender: identity1
      })
    ))
  )

  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        contacts: Immutable.Map({
          [identity1.address]: Contact({
            username: identity1.username,
            address: identity1.address,
            messages,
            lastSeen: testUtils.now
          }),
          [identity2.address]: Contact({
            username: identity2.username,
            address: identity2.address
          })
        })
      })
    })
    jest.clearAllMocks()
  })

  it(' - contacts', () => {
    expect(selectors.contacts(store.getState())).toMatchSnapshot()
  })

  it(' - contact', () => {
    expect(selectors.contact(identity1.address)(store.getState())).toMatchSnapshot()
  })

  it(' - messages', () => {
    expect(selectors.messages(identity1.address)(store.getState())).toMatchSnapshot()
  })

  it(' - lastSeen', () => {
    expect(selectors.lastSeen(identity1.address)(store.getState())).toMatchSnapshot()
  })
})
