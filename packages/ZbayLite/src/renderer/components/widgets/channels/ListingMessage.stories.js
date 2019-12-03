import React from 'react'
import Immutable from 'immutable'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import StoryRouter from 'storybook-react-router'
import create from '../../../store/create'

import { withStore } from '../../../../../.storybook/decorators'

import ListingMessage from './ListingMessage'

const store = create({
  initialState: Immutable.Map({})
})

storiesOf('Components/Widgets/Channels/ListingMessages', module)
  .addDecorator(withKnobs)
  .addDecorator(StoryRouter())
  .addDecorator(withStore(store))
  .add('playground', () => {
    const payload = {
      tag: 'dirtyBike',
      offerOwner: 'roks33',
      description:
        'Great quality bike for half the price as a name brand dirt bike! The X4 ame brand dirt bike! The X4 ',
      title: 'Apollo X4 110cc Dirt Bike for 110cc Dirt Bike for 110cc Dirt Bike for...',
      priceUSD: '300',
      priceZcash: '4000',
      background: 28,
      username: 'test'
    }
    const message = {
      replyTo: 'test-address',
      sender: {
        username: 'roks33',
        replyTo: 'test-address'
      },
      isUnregistered: false,
      username: 'test',
      fromYou: false,
      status: 'broadcasted',
      createdAt: 1575246566,
      error: {}
    }
    return (
      <Grid container direction='column' spacing={2}>
        <Grid item>
          <ListingMessage payload={payload} message={message} />
        </Grid>
      </Grid>
    )
  })
