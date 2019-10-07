/* eslint import/first: 0 */
import Immutable from 'immutable'

import selectors from './invitation'
import { Invitation } from '../handlers/invitation'

import create from '../create'

describe('invitation -', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        invitation: Invitation()
      })
    })
  })

  it('invitation selector', async () => {
    expect(selectors.invitation(store.getState())).toMatchSnapshot()
  })

  it('amount selector', async () => {
    expect(selectors.amount(store.getState())).toMatchSnapshot()
  })

  it('affiliateCode selector', async () => {
    expect(selectors.affiliateCode(store.getState())).toMatchSnapshot()
  })
})
