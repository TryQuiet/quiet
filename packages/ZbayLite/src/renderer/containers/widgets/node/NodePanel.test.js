/* eslint import/first: 0 */
jest.mock('../../hooks', () => ({ useInterval: jest.fn() }))

import React from 'react'
import { shallow } from 'enzyme'

import { useInterval } from '../../hooks'
import { mapDispatchToProps, NodePanel } from './NodePanel'

describe('NodePanel', () => {
  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })

  it('sets interval for getStatus', () => {
    shallow(<NodePanel getStatus={jest.fn()} />)
    expect(useInterval.mock.calls).toMatchSnapshot()
  })
})
