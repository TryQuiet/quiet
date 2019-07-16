/* eslint import/first: 0 */
jest.mock('../../vault')
import React from 'react'
import Immutable from 'immutable'
import { shallow } from 'enzyme'

import { Vault, mapStateToProps, mapDispatchToProps } from './Vault'
import vault from '../../vault'
import create from '../../store/create'
import { VaultState } from '../../store/handlers/vault'
import { NodeState } from '../../store/handlers/node'

describe('Vault', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    vault.exists.mockImplementation(network => network === 'mainnet')
    store = create({
      initialState: Immutable.Map({
        node: NodeState({ status: 'healthy' }),
        vault: VaultState({
          exists: true,
          locked: false
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })

  it('will render redirect when node not connected', () => {
    const props = {
      ...mapDispatchToProps(x => x),
      ...mapStateToProps(store.getState()),
      nodeConnected: false
    }
    const result = shallow(<Vault {...props} />)
    expect(result).toMatchSnapshot()
  })

  it('will render creator when vault does not exist', () => {
    const props = {
      ...mapDispatchToProps(x => x),
      ...mapStateToProps(store.getState()),
      exists: false
    }
    const result = shallow(<Vault {...props} />)
    expect(result).toMatchSnapshot()
  })

  it('will render unlocker when vault locked', () => {
    const props = {
      ...mapDispatchToProps(x => x),
      ...mapStateToProps(store.getState()),
      locked: true
    }
    const result = shallow(<Vault {...props} />)
    expect(result).toMatchSnapshot()
  })
})
