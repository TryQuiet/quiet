import React from 'react'
import { shallow } from 'enzyme'

import { ListingMessage } from './ListingMessage'
import { mockClasses } from '../../../../shared/testing/mocks'

describe('SendMessagePopover', () => {
  it('renders popover', () => {
    const payload = {
      tag: 'dirtyBike',
      offerOwner: 'roks33',
      description: 'Great quality bike for half the price as a name brand dirt bike! The X4',
      title: 'Apollo X4 110cc Dirt Bike for...',
      priceUSD: '300',
      priceZcash: '4000',
      background: '98c9e4113d76a80d654096c9938fb1a3.svg'
    }
    const result = shallow(
      <ListingMessage
        classes={mockClasses}
        payload={payload}
        handleBuy={jest.fn()}
        buyActions={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })
})
