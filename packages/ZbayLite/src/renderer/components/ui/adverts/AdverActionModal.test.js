import React from 'react'
import { shallow } from 'enzyme'

import { AdvertActionModal } from './AdvertActionModal'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SendMessagePopover', () => {
  it('renders popover', () => {
    const payload = {
      tag: 'dirtyBike',
      description: 'Great quality bike for half the price as a name brand dirt bike! The X4',
      title: 'Apollo X4 110cc Dirt Bike for...',
      priceUSD: '300',
      offerOwner: 'roks33',
      priceZcash: '4000',
      background: '98c9e4113d76a80d654096c9938fb1a3.svg'
    }
    const result = shallow(
      <AdvertActionModal
        open
        handleBuy={jest.fn()}
        handleMessage={jest.fn()}
        handleClose={jest.fn()}
        payload={payload}
        classes={mockClasses}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
