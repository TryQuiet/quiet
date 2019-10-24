/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { UsernameCreated } from './UsernameCreated'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('UsernameCreated', () => {
  it('renders component', () => {
    const result = shallow(
      <UsernameCreated
        classes={mockClasses}
        handleClose={jest.fn()}
        setFormSent={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
