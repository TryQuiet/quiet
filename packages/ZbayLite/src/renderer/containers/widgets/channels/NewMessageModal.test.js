/* eslint import/first: 0 */
import Immutable from 'immutable'

import { mapStateToProps, mapDispatchToProps } from './NewMessageModal'

import create from '../../../store/create'

describe('NewMessageModal', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        users: Immutable.Map({
          testuser1: 'user 1 data',
          testuser2: 'user 2 data'
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
