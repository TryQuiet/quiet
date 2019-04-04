/* eslint import/first: 0 */
jest.mock('../../vault')

import React from 'react'
import Immutable from 'immutable'
import { shallow } from 'enzyme'

import { CreateVaultWrapper, mapStateToProps, mapDispatchToProps } from './CreateVault'

import create from '../../store/create'
import { VaultState } from '../../store/handlers/vault'

describe('CreateVault', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
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

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })

  it('should render wrapped component correctly', () => {
    const rendered = shallow(<CreateVaultWrapper {...mapStateToProps(store.getState())} />)
    expect(rendered).toMatchSnapshot()
  })
})
