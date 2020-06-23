import React from 'react'
import { shallow } from 'enzyme'

import { BuyZcash } from './BuyZcash'
import { mockClasses } from '../../../../shared/testing/mocks'
jest.mock('electron', () => {
  const remote = jest.mock()
  remote.app = jest.mock()
  remote.app.getLocaleCountryCode = jest.fn().mockReturnValue(`United States`)
  return { remote }
})
describe('BuyZcash', () => {
  it('renders component', () => {
    const props = {
      classes: mockClasses
    }
    const result = shallow(<BuyZcash {...props} />)
    expect(result).toMatchSnapshot()
  })
})
