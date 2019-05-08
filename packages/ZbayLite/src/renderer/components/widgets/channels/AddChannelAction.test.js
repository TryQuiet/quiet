import React from 'react'
import { shallow } from 'enzyme'

import { AddChannelAction } from './AddChannelAction'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('BaseChannelsList', () => {
  // TODO: [refactoring] test useState when enzyme is up to date
  it('renders component', () => {
    const result = shallow(<AddChannelAction classes={mockClasses} />)
    expect(result).toMatchSnapshot()
  })
})
