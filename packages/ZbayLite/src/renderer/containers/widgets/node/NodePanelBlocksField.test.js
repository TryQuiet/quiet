/* eslint import/first: 0 */
jest.mock('../../../vault')
import React from 'react'
import Immutable from 'immutable'
import { shallow } from 'enzyme'

import { mapStateToProps, NodePanelBlocksField } from './NodePanelBlocksField'

import create from '../../../store/create'
import { NodeState } from '../../../store/handlers/node'

describe('NodePanelBlocksField', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        node: NodeState({
          latestBlock: 12345,
          currentBlock: 18
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
      <NodePanelBlocksField
        {...mapStateToProps(store.getState())}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders the field when no latestBlock', async () => {
    store = create({
      initialState: Immutable.Map({
        node: NodeState({
          latestBlock: 0,
          currentBlock: 0
        })
      })
    })
    const result = shallow(
      <NodePanelBlocksField
        {...mapStateToProps(store.getState())}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
