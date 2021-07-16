import React from 'react'
import BigNumber from 'bignumber.js'
import { shallow } from 'enzyme'

import { mapStateToProps, NodePanelConnectionsField } from './NodePanelConnectionsField'

import create from '../../../store/create'

describe('NodePanelConnectionsField', () => {
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
})
