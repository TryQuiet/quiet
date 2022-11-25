import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { Message } from './Message.component'
import { MessageType } from '@quiet/state-manager'

storiesOf('Message', module)
.add('Default', () => {
  return (
    <Message
      data={[
        {
          id: '1',
          type: MessageType.Basic,
          message:
            'Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.',
          createdAt: 0,
          date: '1:30pm',
          nickname: 'holmes'
        }
      ]}
    />
  )
})
.add('Info', () => {
  return (
    <Message
      data={[
        {
          id: '1',
          type: MessageType.Info,
          message:
            'Hey, @the-emperor just joined!',
          createdAt: 0,
          date: '1:30pm',
          nickname: 'holmes'
        }
      ]}
    />
  )
})
.add('Link', () => {
  const openUrl = (url: string) => {
    console.log(`opened url ${url}`)
  }
  return (
    <Message
      data={[
        {
          id: '1',
          type: MessageType.Info,
          message:
            'Check this out https://github.com/orgs/TryQuiet/projects/1',
          createdAt: 0,
          date: '1:30pm',
          nickname: 'holmes'
        }
      ]}
      openUrl={openUrl}
    />
  )
})
