/* eslint import/first: 0 */
jest.mock('../../../vault')
import React from 'react'
import Immutable from 'immutable'
import { DateTime } from 'luxon'
import { shallow } from 'enzyme'

import { mapStateToProps, NodePanelUptimeField } from './NodePanelUptimeField'

import create from '../../../store/create'
import { NodeState } from '../../../store/handlers/node'

describe('NodePanelConnectionsField', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        node: NodeState({
          startedAt: DateTime.utc(2019, 11, 23, 12, 28, 34)
        })
      })
    })
  })

  it('will receive right props', async () => {
    const now = DateTime.utc(2019, 11, 24, 13, 12, 58)
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('renders the uptime', async () => {
    const now = DateTime.utc(2019, 11, 24, 13, 38, 58)
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
    const result = shallow(
      <NodePanelUptimeField
        {...mapStateToProps(store.getState())}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders the uptime when less than day', async () => {
    const now = DateTime.utc(2019, 11, 23, 13, 38, 58)
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
    const result = shallow(
      <NodePanelUptimeField
        {...mapStateToProps(store.getState())}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders the uptime when less than hour', async () => {
    const now = DateTime.utc(2019, 11, 23, 13, 13, 58)
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
    const result = shallow(
      <NodePanelUptimeField
        {...mapStateToProps(store.getState())}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
