/* eslint import/first: 0 */
import Immutable from 'immutable'

import { mapStateToProps, mapDispatchToProps } from './BlockedUsers'

import create from '../../../store/create'

describe('BlockedUsers', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
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
        }),
        notificationCenter: {
          contacts: Immutable.Map({
            ztestsapling14dxhlp8ps4qmrslt7pcayv8yuyx78xpkrtfhdhae52rmucgqws2zp0zwf2zu6qxjp96lzapsn4r: 4
          })
        }
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
