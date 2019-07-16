/* eslint import/first: 0 */
jest.mock('../../vault')
import React from 'react'
import { shallow } from 'enzyme'

import { Index, mapStateToProps, mapDispatchToProps } from './Index'
import create from '../../store/create'
import vaultHandlers from '../../store/handlers/vault'

describe('Index', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create()
  })

  it('will receive right props', async () => {
    await store.dispatch(vaultHandlers.actions.unlockVault({ masterPassword: 'test' }))
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })

  it('will render redirect when node connected', () => {
    const props = {
      ...mapDispatchToProps(x => x),
      nodeConnected: true
    }
    const result = shallow(<Index {...props} />)
    expect(result).toMatchSnapshot()
  })

  it('will render component when node not connected', () => {
    const props = {
      ...mapDispatchToProps(x => x),
      nodeConnected: false
    }
    const result = shallow(<Index {...props} />)
    expect(result).toMatchSnapshot()
  })
})
