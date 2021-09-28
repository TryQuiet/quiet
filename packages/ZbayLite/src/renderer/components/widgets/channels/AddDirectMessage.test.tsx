import React from 'react'
import { shallow } from 'enzyme'

import { AddDirectMessage } from './AddDirectMessage'

describe('AddDirectMessage', () => {
  it('renders component', () => {
    const openModal = jest.fn()
    const result = shallow(<AddDirectMessage openModal={openModal} />)
    expect(result).toMatchSnapshot()
  })
})
