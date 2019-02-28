/* eslint import/first: 0 */
jest.mock('../../vault', () => ({
  create: jest.fn(async () => null),
  unlock: jest.fn(async () => null),
  exists: jest.fn(() => true)
}))
import React from 'react'
import { shallow } from 'enzyme'

import { CreateVaultWrapper, mapStateToProps, mapDispatchToProps } from './CreateVault'

import create from '../../store/create'
import vaultHandlers from '../../store/handlers/vault'

describe('CreateVault', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create()
  })

  it('will receive right props', async () => {
    await store.dispatch(vaultHandlers.actions.createVault())
    await store.dispatch(vaultHandlers.actions.unlockVault())
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })

  it('should render wrapped component correctly', () => {
    const rendered = shallow(<CreateVaultWrapper {...mapStateToProps(store.getState())} />)
    expect(rendered).toMatchSnapshot()
  })
})
