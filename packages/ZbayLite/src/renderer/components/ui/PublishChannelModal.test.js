/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'

import { PublishChannelModal } from './PublishChannelModal'
import { mockClasses } from '../../../shared/testing/mocks'
import BigNumber from 'bignumber.js'
import Immutable from 'immutable'
describe('PubliPublishChannelModal', () => {
  it('renders component', () => {
    const result = shallow(
      <PublishChannelModal
        classes={mockClasses}
        balance={new BigNumber(1)}
        zcashRate={11}
        publicChannelFee={11}
        handleClose={() => {}}
        publishChannel={() => {}}
        publicChannels={Immutable.Map({})}
        channel={{ address: '123' }}
        open
        tooltipText='sample text'
      />
    )
    expect(result).toMatchSnapshot()
  })
})
