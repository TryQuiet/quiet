import React from 'react'
import Immutable from 'immutable'
import Grid from '@material-ui/core/Grid'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import StoryRouter from 'storybook-react-router'
import create from '../../../store/create'
import BigNumber from 'bignumber.js'

import { withStore } from '../../../../../.storybook/decorators'

import ItemTransferMessage from './ItemTransferMessage'

const store = create({
  initialState: Immutable.Map({})
})

storiesOf('Components/Widgets/Channels/ItemTransferMessage', module)
  .addDecorator(withKnobs)
  .addDecorator(StoryRouter())
  .addDecorator(withStore(store))
  .add('playground', () => {
    const message = {
      replyTo: 'test-address',
      spent: 120,
      sender: {
        username: 'test',
        replyTo: 'test-address'
      },
      tag: 'test',
      offerOwner: 'tester',
      isUnregistered: false,
      username: 'test',
      fromYou: false,
      status: 'broadcasted',
      createdAt: 1313246566,
      error: {}
    }
    return (
      <Grid container direction='column' spacing={2}>
        <Grid item>
          <ItemTransferMessage message={message} rateUsd={new BigNumber(38)} />
        </Grid>
      </Grid>
    )
  })
