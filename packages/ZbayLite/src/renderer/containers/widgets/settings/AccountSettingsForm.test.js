/* eslint import/first: 0 */
import Immutable from 'immutable'

import { mapStateToProps, mapDispatchToProps } from './AccountSettingsForm'

import create from '../../../store/create'
import { Identity, IdentityState } from '../../../store/handlers/identity'

describe('AccountSettingsForm', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        identity: IdentityState({
          data: Identity({
            address: 'test-z-address',
            transparentAddress: 'test-t-address',
            name: 'Saturn',
            signerPubKey: 'address'
          })
        }),
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
