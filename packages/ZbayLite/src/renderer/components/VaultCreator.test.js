/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../shared/testing/mocks'
import { VaultCreator } from './VaultCreator'

describe('VaultCreator', () => {
  it('renders component', () => {
    const password = 'test password'
    const result = shallow(
      <VaultCreator
        classes={mockClasses}
        password={password}
        repeat={password}
        onSend={jest.fn()}
        handleTogglePassword={jest.fn()}
        handleToggleRepeat={jest.fn()}
        handleSetPassword={jest.fn()}
        handleSetRepeat={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders disabled when different password', () => {
    const result = shallow(
      <VaultCreator
        classes={mockClasses}
        password='test password'
        repeat='test repeat'
        passwordVisible={false}
        repeatVisible={false}
        onSend={jest.fn()}
        handleTogglePassword={jest.fn()}
        handleToggleRepeat={jest.fn()}
        handleSetPassword={jest.fn()}
        handleSetRepeat={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders with visible passwords', () => {
    const password = 'test password'
    const result = shallow(
      <VaultCreator
        classes={mockClasses}
        password={password}
        repeat={password}
        passwordVisible
        repeatVisible
        onSend={jest.fn()}
        handleTogglePassword={jest.fn()}
        handleToggleRepeat={jest.fn()}
        handleSetPassword={jest.fn()}
        handleSetRepeat={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders custom styles', () => {
    const password = 'test password'
    const result = shallow(
      <VaultCreator
        classes={mockClasses}
        styles={{
          wrapper: 'wrapper-class',
          button: 'button-class'
        }}
        password={password}
        repeat={password}
        passwordVisible={false}
        repeatVisible={false}
        onSend={jest.fn()}
        handleTogglePassword={jest.fn()}
        handleToggleRepeat={jest.fn()}
        handleSetPassword={jest.fn()}
        handleSetRepeat={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
