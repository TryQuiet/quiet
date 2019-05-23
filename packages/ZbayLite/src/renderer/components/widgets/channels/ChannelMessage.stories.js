import React from 'react'
import Immutable from 'immutable'
import { DateTime } from 'luxon'
import { storiesOf } from '@storybook/react'

import ChannelMessage from './ChannelMessage'

storiesOf('Widgets/Channels/ChannelMessage', module)
  .add('with loaded message', () => {
    const message = Immutable.fromJS({
      type: 1,
      sender: {
        replyTo: '',
        username: 'Saturn'
      },
      createdAt: DateTime.utc().toSeconds(),
      message: 'Hi there, how is it going?'
    })
    return <ChannelMessage message={message} />
  })
