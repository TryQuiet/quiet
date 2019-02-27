/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { PasswordInput } from './PasswordInput'

describe('PasswordInput', () => {
  it('renders component', () => {
    const result = shallow(
      <PasswordInput
        label='Master password'
        password='test password'
        passwordVisible={false}
        handleTogglePassword={jest.fn()}
        handleSetPassword={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders with error', () => {
    const result = shallow(
      <PasswordInput
        password=''
        passwordVisible={false}
        handleTogglePassword={jest.fn()}
        handleSetPassword={jest.fn()}
        error
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders with password visible', () => {
    const result = shallow(
      <PasswordInput
        password=''
        passwordVisible
        handleTogglePassword={jest.fn()}
        handleSetPassword={jest.fn()}
        error
      />
    )
    expect(result).toMatchSnapshot()
  })
})
