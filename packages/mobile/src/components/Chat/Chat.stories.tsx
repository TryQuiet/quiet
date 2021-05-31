import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function';

import { Chat } from './Chat.component';

storiesOf('Chat', module).add('Default', () => (
  <Chat
    sendMessageAction={storybookLog('Message sent')}
    channel={{
      name: 'Zbay',
      description: '',
      owner: '',
      timestamp: 0,
      address: '',
    }}
    messages={[
      {
        message: {
          id: '1',
          type: 0,
          typeIndicator: 0,
          message:
            'Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.',
          createdAt: 0,
          r: 0,
          channelId: '',
          signature: '',
        },
        nickname: 'holmes',
        datetime: '1:30pm',
      },
      {
        message: {
          id: '2',
          type: 0,
          typeIndicator: 0,
          message:
            'Bear claw bear claw donut marzipan chocolate cake sugar plum pie. Chocolate cake chocolate bar ice cream. Marzipan powder brownie muffin jelly beans. Sesame snaps tootsie roll macaroon donut.',
          createdAt: 0,
          r: 0,
          channelId: '',
          signature: '',
        },
        nickname: 'holmes',
        datetime: '1:32pm',
      },
      {
        message: {
          id: '3',
          type: 0,
          typeIndicator: 0,
          message: 'Marshmallows!',
          createdAt: 0,
          r: 0,
          channelId: '',
          signature: '',
        },
        nickname: 'emily',
        datetime: '1:32pm',
      },
      {
        message: {
          id: '4',
          type: 0,
          typeIndicator: 0,
          message:
            'Chupa chups soufflé danish. Cake chocolate brownie cookie bear claw soufflé. Muffin chupa chups sweet caramels jelly beans chocolate bar bonbon liquorice.',
          createdAt: 0,
          r: 0,
          channelId: '',
          signature: '',
        },
        nickname: 'bartek',
        datetime: '1:32pm',
      },
    ]}
    user={'holmes'}
  />
));
