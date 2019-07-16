/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { VaultUnlockerForm } from './VaultUnlockerForm'

describe('VaultUnlockerForm', () => {
  it('renders component', () => {
    const result = shallow(
      <VaultUnlockerForm
        classes={mockClasses}
        locked
        onSubmit={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
