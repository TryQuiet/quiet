/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { IconCopy } from './IconCopy'

describe('IconCopy', () => {
  it('renders component', () => {
    const result = shallow(
      <IconCopy classes={mockClasses} />
    )
    expect(result).toMatchSnapshot()
  })
})
