/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'

import { mapStateToProps } from './IdentityPanel'

import create from '../../store/create'
import { IdentityState, Identity } from '../../store/handlers/identity'

describe('IdentityPanel', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        identity: IdentityState({
          data: Identity({
            address: 'zctestaddress',
            balance: '23.435432',
            name: 'saturn'
          })
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })
})
