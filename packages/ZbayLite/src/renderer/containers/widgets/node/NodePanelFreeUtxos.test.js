import React from 'react'
import { shallow } from 'enzyme'

import {
  mapStateToProps,
  NodePanelFreeUtxos
} from './NodePanelFreeUtxos'

import create from '../../../store/create'
import { initialState } from '../../../store/handlers/identity'

describe('NodePanelFreeUtxos', () => {
  let store = null
  beforeEach(() => {
    store = create({
      identity: {
        ...initialState,
        data: { freeUtxos: 5 }
      }
    }
    )
  })

  it('will receive right props', async () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('renders the field', async () => {
    const result = shallow(
      <NodePanelFreeUtxos {...mapStateToProps(store.getState())} />
    )
    expect(result).toMatchSnapshot()
  })
})
