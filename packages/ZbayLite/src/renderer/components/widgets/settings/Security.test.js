/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import { Security } from './Security'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('Security', () => {
  it('renders component', () => {
    const result = shallow(
      <Security
        classes={mockClasses}
        removeImageHost={jest.fn()}
        removeSiteHost={jest.fn()}
        toggleAllowAll={jest.fn()}
        whitelisted={Immutable.List('test', 'test2')}
        autoload={Immutable.List('test3', 'test4')}
        allowAll
      />
    )
    expect(result).toMatchSnapshot()
  })
})
