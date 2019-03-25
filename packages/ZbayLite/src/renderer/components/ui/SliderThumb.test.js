/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { SliderThumb } from './SliderThumb'

describe('SliderThumb', () => {
  it('renders component', () => {
    const result = shallow(<SliderThumb classes={mockClasses} />)
    expect(result).toMatchSnapshot()
  })
})
