import React from 'react'
import BigNumber from 'bignumber.js'
import { shallow } from 'enzyme'

import { mapStateToProps, NodePanelConnectionsField } from './NodePanelConnectionsField'

import create from '../../../store/create'
import { NodeState } from '../../../store/handlers/node'

describe('NodePanelConnectionsField', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: {
        node: {
          ...NodeState,
          connections: new BigNumber(12)
        }
      }
    })
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('renders the field', async () => {
    const result = shallow(
      <NodePanelConnectionsField
        {...mapStateToProps(store.getState())}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
