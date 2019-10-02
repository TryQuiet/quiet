/* eslint import/first: 0 */
jest.mock('../../../vault')
import React from 'react'
import Immutable from 'immutable'
import { shallow } from 'enzyme'

import { mapStateToProps, NodePanelNetworkField } from './NodePanelNetworkField'

import create from '../../../store/create'
import { NodeState } from '../../../store/handlers/node'

describe('NodePanelNetworkField', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        node: NodeState({
          isTestnet: true
        })
      })
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('renders the field', async () => {
    const result = shallow(
      <NodePanelNetworkField
        {...mapStateToProps(store.getState())}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
