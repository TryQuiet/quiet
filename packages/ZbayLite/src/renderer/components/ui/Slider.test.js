/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { Slider } from './Slider'

describe('Slider', () => {
  it('renders component', () => {
    const result = shallow(
      <Slider
        classes={mockClasses}
        value={23}
        handleOnChange={jest.fn()}
        title='this is a title of the slider'
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders with labels', () => {
    const result = shallow(
      <Slider
        classes={mockClasses}
        value={23}
        handleOnChange={jest.fn()}
        title='this is a title of the slider'
        minLabel='$ MIN'
        maxLabel='$ MAX'
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('renders custom min/max', () => {
    const result = shallow(
      <Slider
        classes={mockClasses}
        value={8}
        handleOnChange={jest.fn()}
        title='this is a title of the slider'
        min={-20}
        max={20}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
