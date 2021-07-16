/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'
import { Security } from './Security'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('Security', () => {
  it('renders component', () => {
    const result = shallow(
      <Security
        classes={mockClasses}
        openSeedModal={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
