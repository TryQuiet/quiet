import React from 'react';
import { storiesOf } from '@storybook/react-native';
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
        id: '1',
        type: '1',
        message:
          'Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.',
        createdAt: '1:30pm',
        nickname: 'holmes',
      },
      {
        id: '2',
        type: '1',
        message:
          'Bear claw bear claw donut marzipan chocolate cake sugar plum pie. Chocolate cake chocolate bar ice cream. Marzipan powder brownie muffin jelly beans. Sesame snaps tootsie roll macaroon donut.',
        createdAt: '1:32pm',
        nickname: 'holmes',
      },
      {
        id: '3',
        type: '1',
        message: 'Marshmallows!',
        createdAt: '1:32pm',
        nickname: 'emily',
      },
      {
        id: '4',
        type: '1',
        message:
          'Chupa chups soufflé danish. Cake chocolate brownie cookie bear claw soufflé. Muffin chupa chups sweet caramels jelly beans chocolate bar bonbon liquorice.',
        createdAt: '1:32pm',
        nickname: 'bartek',
      },
    ]}
    user={'holmes'}
  />
));
