import React from 'react'
import Immutable from 'immutable'
import { DateTime } from 'luxon'
import { storiesOf } from '@storybook/react'
import StoryRouter from 'storybook-react-router'
import { withKnobs, select, text, boolean } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'

import { DisplayableMessage } from '../../../zbay/messages'
import ChannelMessage from './ChannelMessage'
import { withStore } from '../../../../../.storybook/decorators'
import create from '../../../store/create'

const store = create({
  initialState: Immutable.Map({})
})

storiesOf('Components/Widgets/Channels/ChannelMessage', module)
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
      id: 'message-id-1',
      type: 1,
      sender: {
        replyTo: 'zs1testaddress1234',
        username: 'Saturn'
      },
      createdAt: DateTime.utc().toSeconds(),
      status: stateValue,
      fromYou: boolean('fromYou', false),
      message: 'Hi there, how is it going?'
    }).set('error', error)
    return (
      <ChannelMessage
        message={DisplayableMessage(message)}
        onResend={action('Resending')}
        onReply={action('Replying')}
        onCancel={action('Cancelling')}
      />
    )
  })
  .add('failed message', () => {
    const error = {
      code: -9,
      message: text('Error message', 'Something went really badly.')
    }
    const message = Immutable.fromJS({
      id: 'message-id-1',
      type: 1,
      sender: {
        replyTo: 'zs1testaddress1234',
        username: 'Saturn'
      },
      createdAt: DateTime.utc().toSeconds(),
      status: 'failed',
      fromYou: true,
      message: 'Hi there, how is it going?'
    }).set('error', error)
    return (
      <ChannelMessage
        message={DisplayableMessage(message)}
        onResend={action('Resending')}
        onReply={action('Replying')}
        onCancel={action('Cancelling')}
      />
    )
  })
