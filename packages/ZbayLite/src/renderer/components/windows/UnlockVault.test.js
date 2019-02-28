/* eslint import/first: 0 */
jest.mock('../../containers/VaultUnlocker', () => {
  const VaultUnlocker = () => (<div>VaultUnlocker</div>)
  return VaultUnlocker
})
import React from 'react'
import { shallow } from 'enzyme'

import { UnlockVault } from './UnlockVault'
import { mockClasses } from '../../../shared/testing/mocks'

describe('UnlockVault', () => {
  const originalDate = Date.now

  beforeAll(() => {
    global.Date.now = jest.fn(() => 1536662638084)
  })

  afterAll(() => {
    global.Date.now = originalDate
  })

  it('renders component', () => {
    const result = shallow(
      <UnlockVault
        classes={mockClasses}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders unlocked', () => {
    const result = shallow(
      <UnlockVault
        classes={mockClasses}
        locked={false}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
