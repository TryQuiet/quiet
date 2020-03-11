import React from 'react'
import { shallow } from 'enzyme'
import { Notifications } from './Notifications'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('Notifications', () => {
  it('renders component', () => {
    const props = {
      classes: mockClasses,
      userFilterType: 1,
      setUserNotification: jest.fn()
    }
    const result = shallow(<Notifications {...props} />)
    expect(result).toMatchSnapshot()
  })
})
