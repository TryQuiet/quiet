/* eslint import/first: 0 */
jest.mock('../../containers/VaultCreator', () => {
  const VaultCreator = () => (<div>VaultCreator</div>)
  return VaultCreator
})
import React from 'react'
import { shallow } from 'enzyme'

import { CreateVault } from './CreateVault'
import { mockClasses } from '../../../shared/testing/mocks'

describe('CreateVault', () => {
  it('renders component', () => {
    const result = shallow(
      <CreateVault
        classes={mockClasses}
        onCloseSnackbar={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders inProgress', () => {
    const result = shallow(
      <CreateVault
        classes={mockClasses}
        onCloseSnackbar={jest.fn()}
        inProgress
        inProgressMsg='creating'
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders error', () => {
    const result = shallow(
      <CreateVault
        classes={mockClasses}
        onCloseSnackbar={jest.fn()}
        error='test error'
      />
    )
    expect(result).toMatchSnapshot()
  })
})
