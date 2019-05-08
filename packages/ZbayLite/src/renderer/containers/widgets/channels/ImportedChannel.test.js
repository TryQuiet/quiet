/* eslint import/first: 0 */
import Immutable from 'immutable'

import { mapStateToProps, mapDispatchToProps } from './ImportedChannel'

import create from '../../../store/create'
import { ImportedChannelState } from '../../../store/handlers/importedChannel'

describe('ImportedChannel', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        importedChannel: ImportedChannelState({
          // TODO: 07/05 change to Record
          data: Immutable.fromJS({
            name: 'Politics',
            private: true,
            address: 'zs1testaddress',
            description: 'This is a simple test channel',
            keys: {
              ivk: 'this-is-an-ivk-key'
            }
          })
        })
      })
    })
  })

  it('will receive right props', () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
