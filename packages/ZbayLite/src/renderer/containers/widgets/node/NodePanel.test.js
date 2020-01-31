/* eslint import/first: 0 */
jest.mock('../../hooks', () => ({ useInterval: jest.fn() }))

import React from 'react'
import { shallow } from 'enzyme'

import { useInterval } from '../../hooks'
import { NodePanel } from './NodePanel'

describe('NodePanel', () => {
  it('sets interval for getStatus', () => {
    shallow(<NodePanel getStatus={jest.fn()} freeUtxos={2} />)
    expect(useInterval.mock.calls).toMatchSnapshot()
  })
})
