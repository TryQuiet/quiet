/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { mockClasses } from '../../../shared/testing/mocks'
import { Icon } from './Icon'
import icon from '../../static/images/zcash/zcash-icon-fullcolor.svg'

describe('Icon', () => {
  it('renders component', () => {
    const props = {
      className: mockClasses,
      src: icon
    }
    const result = shallow(
      <Icon {...props} />
    )
    expect(result).toMatchSnapshot()
  })
})
