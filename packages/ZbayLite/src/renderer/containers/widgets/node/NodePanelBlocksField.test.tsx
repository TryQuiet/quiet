import React from 'react'
import { shallow } from 'enzyme'

import { mapStateToProps, NodePanelBlocksField } from './NodePanelBlocksField'

import create from '../../../store/create'

describe('NodePanelBlocksField', () => {
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
      <NodePanelBlocksField
        {...mapStateToProps(store.getState())}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders the field when no latestBlock', async () => {
    store = create({

    })
    const result = shallow(
      <NodePanelBlocksField
        {...mapStateToProps(store.getState())}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
