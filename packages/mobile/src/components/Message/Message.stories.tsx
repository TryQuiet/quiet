import { storiesOf } from '@storybook/react-native';
import React from 'react';

import { Message } from './Message.component';

storiesOf('Message', module).add('Default', () => {
  return (
    <Message
      message={{
        message: {
          id: '',
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
      }}
    />
  );
});
