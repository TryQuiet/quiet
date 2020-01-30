
import React from 'react'
import { shallow } from 'enzyme'

import { ChannelInfo } from './ChannelInfo'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ChannelInfo', () => {
  it('renders component', () => {
    const result = shallow(
      <ChannelInfo
        classes={mockClasses}
        initialValues={{
          updateChannelDescription: '',
          updateMinFee: false
        }}
        updateChannelSettings={() => {}}
        rateZec={1}
        rateUsd={1}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
