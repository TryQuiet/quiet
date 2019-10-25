/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { DonationsSettingsForm } from './DonationsSettingsForm'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('DonationsSettingsForm', () => {
  it('renders component', () => {
    const result = shallow(
      <DonationsSettingsForm
        classes={mockClasses}
        initialValues={{ donationAddress: 'test-zash-address' }
        }
        updateDonation={jest.fn()}
        updateDonationAddress={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
