/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { Carousel } from './Carousel'

describe('Carousel', () => {
  it('renders component', () => {
    const result = shallow(
      <Carousel
        classes={mockClasses}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
