/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { AccountSettingsForm } from './AccountSettingsForm'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('AccountSettingsForm', () => {
  it('renders component', () => {
    const result = shallow(
      <AccountSettingsForm
        classes={mockClasses}
        initialValues={{
          nickname: 'Saturn'
        }}
        transparentAddress='t-address'
        privateAddress='z-address'
        handleCopy={jest.fn()}
        handleSubmit={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
