/* eslint import/first: 0 */
jest.mock('../../hooks', () => ({ useInterval: jest.fn() }))

import React from 'react'
import { shallow } from 'enzyme'

import { useInterval } from '../../hooks'
import { mapDispatchToProps, WalletPanel } from './WalletPanel'

describe('WalletPanel', () => {
  it('will receive right actions', async () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })

  it('sets interval for getBalance', () => {
    shallow(<WalletPanel fetchPrices={jest.fn()} />)
    expect(useInterval.mock.calls).toMatchSnapshot()
  })
})
