/* eslint import/first: 0 */
jest.mock('../../../vault')
import Immutable from 'immutable'

import { mapStateToProps } from './DirectMessagesHeader'

import create from '../../../store/create'

describe('ChannelHeader', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.fromJS({
        contacts: {
          address123: {
            username: 'testusername'
          }
        }
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState(), { contactId: 'address123' })
    expect(props).toMatchSnapshot()
  })
})
