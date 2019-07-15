import React from 'react'
import BigNumber from 'bignumber.js'
import { shallow } from 'enzyme'

import { ChannelContent } from './ChannelContent'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('ChannelContent', () => {
  it('renders component', () => {
    const result = shallow(<ChannelContent classes={mockClasses} />)
    expect(result).toMatchSnapshot()
  })

  it('renders not disabled when balance not 0', () => {
    const result = shallow(<ChannelContent classes={mockClasses} balance={new BigNumber(12.23)} />)
    expect(result).toMatchSnapshot()
  })
})
