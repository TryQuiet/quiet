import React from 'react'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'

import ListingMessage from './ListingMessage'

storiesOf('Components/Widgets/Channels/ListingMessages', module)
  .addDecorator(withKnobs)
  .add('playground', () => {
    const payload = {
      tag: 'dirtyBike',
      offerOwner: 'roks33',
      description: 'Great quality bike for half the price as a name brand dirt bike! The X4',
      title: 'Apollo X4 110cc Dirt Bike for...',
      priceUSD: '300',
      priceZcash: '4000',
      background: '98c9e4113d76a80d654096c9938fb1a3.svg'
    }
    return (
      <Grid container direction='column' spacing={2}>
        <Grid item>
          <ListingMessage
            payload={payload}
          />
        </Grid>
      </Grid>
    )
  })
