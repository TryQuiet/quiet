import React from 'react'
import Immutable from 'immutable'
import { DateTime } from 'luxon'
import Grid from '@material-ui/core/Grid'
import StoryRouter from 'storybook-react-router'

import { storiesOf } from '@storybook/react'
import { withKnobs, select, boolean } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import BigNumber from 'bignumber.js'

import { withStore } from '../../../../../.storybook/decorators'
import create from '../../../store/create'

import { DisplayableMessage } from '../../../zbay/messages'
import ChannelTransferMessage from './ChannelTransferMessage'
const store = create({
  initialState: Immutable.Map({})
})
storiesOf('Components/Widgets/Channels/ChannelTransferMessage', module)
  .addDecorator(withKnobs)
  .addDecorator(StoryRouter())
  .addDecorator(withStore(store))
  .add('playground', () => {
    const stateValue = select(
      'Status',
      ['broadcasted', 'pending', 'success', 'cancelled', 'failed'],
      'broadcasted'
    )
    const error = {
      code: -9,
      message: 'Something went really badly.'
    }

    const message = Immutable.fromJS({
      id: '879e811b8ccf4d3956e4e38ac514306bc2e4ff91af2520e2c162643a7a0c5985',
      type: 1,
      sender: {
        replyTo: 'zs1testaddress1234',
        username: 'Saturn'
      },
      receiver: {
        replyTo: 'zs1testaddress1234',
        username: 'Nobody'
      },
      createdAt: DateTime.utc().toSeconds(),
      status: stateValue,
      fromYou: boolean('fromYou', false),
      message: 'Thanks See you later',
      spent: new BigNumber(10)
    }).set('error', error)
    return (
      <Grid container direction='column' spacing={2}>
        <Grid item>
          <ChannelTransferMessage
            message={DisplayableMessage(message)}
            onResend={action('Resending')}
            onReply={action('Replying')}
            onCancel={action('Cancelling')}
            rateUsd={new BigNumber(2.6)}
            userAddress='zs1testaddress1234'
          />
        </Grid>
      </Grid>
    )
  })
