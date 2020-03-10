/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'
import BigNumber from 'bignumber.js'

import { mockClasses } from '../../../shared/testing/mocks'
import { VaultUnlockerForm } from './VaultUnlockerForm'
jest.mock('../../../shared/electronStore', () => ({
  set: () => {},
  get: () => {}
}))

describe('VaultUnlockerForm', () => {
  it('renders component', () => {
    const result = shallow(
      <VaultUnlockerForm
        classes={mockClasses}
        locked
        onSubmit={jest.fn()}
        newUser={false}
        done={false}
        nodeConnected={false}
        loader={{}}
        isLogIn={false}
        node={{
          latestBlock: new BigNumber(123),
          currentBlock: new BigNumber(12)
        }}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
