/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'

import { mapStateToProps, mapDispatchToProps } from './FailedUsernameRegister'

import create from '../../store/create'

describe('FailedUsernameRegister', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({})
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
