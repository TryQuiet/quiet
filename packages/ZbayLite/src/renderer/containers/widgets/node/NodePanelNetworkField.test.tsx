import React from 'react'
import { shallow } from 'enzyme'

import { mapStateToProps, NodePanelNetworkField } from './NodePanelNetworkField'

import create from '../../../store/create'

describe('NodePanelNetworkField', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
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
