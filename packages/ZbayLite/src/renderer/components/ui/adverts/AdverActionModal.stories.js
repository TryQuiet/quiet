import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'

import AdvertActionModal from './AdvertActionModal'

storiesOf('Components/UI/AdvertActionModal', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    const payload = {
      tag: 'dirtyBike',
      description: 'Great quality bike for half the price as a name brand dirt bike! The X4',
      title: 'Apollo X4 110cc Dirt Bike for...',
      priceUSD: '300',
      offerOwner: 'roks33',
      priceZcash: '4000',
      background: 28,
      username: 'test User',
      createdAt: 1574089556
    }
    return <AdvertActionModal open priceUSD={300} priceZcash={4000} payload={payload} />
  })
