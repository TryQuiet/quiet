/* eslint import/first: 0 */
import { mapStateToProps, mapDispatchToProps } from './AccountSettingsForm'

import create from '../../../store/create'
import { initialState } from '../../../store/handlers/identity'

describe('AccountSettingsForm', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      identity: {
        ...initialState,
        data: {
          ...initialState.data,
          address: 'test-z-address',
          transparentAddress: 'test-t-address',
          name: 'Saturn',
          signerPubKey: 'address'
        }
      },
      users: {
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
      }
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
