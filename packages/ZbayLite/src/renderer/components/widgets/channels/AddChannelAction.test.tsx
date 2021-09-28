import React from 'react'
import { shallow } from 'enzyme'

import { AddChannelAction } from './AddChannelAction'

describe('BaseChannelsList', () => {
  // TODO: [refactoring] test useState when enzyme is up to date
  it('renders component', () => {
    const openModal = jest.fn()
    const result = shallow(<AddChannelAction openCreateModal={openModal} />)
    expect(result).toMatchSnapshot()
  })
})
