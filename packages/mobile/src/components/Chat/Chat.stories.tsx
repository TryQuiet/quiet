import React from 'react'
import { storiesOf } from '@storybook/react-native'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { Chat } from './Chat.component'
import { MessageType } from '@quiet/nectar'

storiesOf('Chat', module).add('Default', () => (
  <Chat
    sendMessageAction={storybookLog('Message sent')}
    channel={{
      name: 'Zbay',
      description: '',
      owner: '',
      timestamp: 0,
      address: ''
    }}
    messages={[
      {
        id: '1',
        type: MessageType.Basic,
        message:
          'Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.',
        createdAt: 0,
        date: '1:30pm',
        nickname: 'holmes'
      },
      {
        id: '2',
        type: MessageType.Basic,
        message:
          'Bear claw bear claw donut marzipan chocolate cake sugar plum pie. Chocolate cake chocolate bar ice cream. Marzipan powder brownie muffin jelly beans. Sesame snaps tootsie roll macaroon donut.',
        createdAt: 0,
        date: '1:32pm',
        nickname: 'holmes'
      },
      {
        id: '3',
        type: MessageType.Basic,
        message: 'Marshmallows!',
        createdAt: 0,
        date: '1:32pm',
        nickname: 'emily'
      },
      {
        id: '4',
        type: MessageType.Basic,
        message:
          'Chupa chups soufflé danish. Cake chocolate brownie cookie bear claw soufflé. Muffin chupa chups sweet caramels jelly beans chocolate bar bonbon liquorice.',
        createdAt: 0,
        date: '1:32pm',
        nickname: 'bartek'
      }
    ]}
    user={'holmes'}
  />
))
