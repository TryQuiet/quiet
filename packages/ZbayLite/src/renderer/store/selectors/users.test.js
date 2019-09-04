/* eslint import/first: 0 */
import Immutable from 'immutable'

import create from '../create'
import selectors from './users'

describe('users selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        users: Immutable.fromJS({
          [Buffer.from('address')]: {
            firstName: 'testname',
            lastName: 'testlastname',
            nickname: 'nickname',
            address:
              'ztestsapling14dxhlp8ps4qmrslt7pcayv8yuyx78xpkrtfhdhae52rmucgqws2zp0zwf2zu6qxjp96lzapsn4r'
          },
          [Buffer.from('address2')]: {
            firstName: 'testname2',
            lastName: 'testlastname2',
            nickname: 'nickname2',
            address:
              'ztestsapling14dxhlp8ps4qmrslt7pcayv8yuyx78xpkrtfhdhae52rmucgqws2zp0zwf2zu6qxjp96lzapsn4r'
          }
        })
      })
    })
    jest.clearAllMocks()
  })

  it(' - users', () => {
    expect(selectors.users(store.getState())).toMatchSnapshot()
  })

  it(' - username', () => {
    expect(selectors.registeredUser('address')(store.getState())).toMatchSnapshot()
  })
})
