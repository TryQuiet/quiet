/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../shared/testing/mocks'
import { VaultUnlocker } from './VaultUnlocker'

describe('VaultUnlocker', () => {
  it('renders component', () => {
    const result = shallow(
      <VaultUnlocker
        password=''
        classes={mockClasses}
        onClick={jest.fn()}
        onCloseSnackbar={jest.fn()}
        handleSetPassword={jest.fn()}
        handleTogglePassword={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders unlocking', () => {
    const result = shallow(
      <VaultUnlocker
        password='master password'
        classes={mockClasses}
        onClick={jest.fn()}
        onCloseSnackbar={jest.fn()}
        handleSetPassword={jest.fn()}
        handleTogglePassword={jest.fn()}
        unlocking
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders error', () => {
    const result = shallow(
      <VaultUnlocker
        password='master password'
        classes={mockClasses}
        onClick={jest.fn()}
        onCloseSnackbar={jest.fn()}
        handleSetPassword={jest.fn()}
        handleTogglePassword={jest.fn()}
        error='something failed'
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders unlocked', () => {
    const result = shallow(
      <VaultUnlocker
        password='master password'
        classes={mockClasses}
        onClick={jest.fn()}
        onCloseSnackbar={jest.fn()}
        handleSetPassword={jest.fn()}
        handleTogglePassword={jest.fn()}
        locked={false}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders password visible', () => {
    const result = shallow(
      <VaultUnlocker
        password='master password'
        classes={mockClasses}
        onClick={jest.fn()}
        onCloseSnackbar={jest.fn()}
        handleSetPassword={jest.fn()}
        handleTogglePassword={jest.fn()}
        passwordVisible
      />
    )
    expect(result).toMatchSnapshot()
  })
})
