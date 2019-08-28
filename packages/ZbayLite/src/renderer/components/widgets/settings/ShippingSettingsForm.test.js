/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { ShippingSettingsForm } from './ShippingSettingsForm'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ShippingSettingsForm', () => {
  it('renders component', () => {
    const result = shallow(
      <ShippingSettingsForm
        classes={mockClasses}
        initialValues={{
          firstName: 'Rumble',
          lastName: 'Fish',
          street: 'RumbleFish street',
          country: 'RumbleFish country',
          region: 'Fish Region',
          city: 'Fishville',
          postalCode: '1337-455'
        }}
        handleSubmit={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
