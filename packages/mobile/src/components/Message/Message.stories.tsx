import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { MessageTypes } from '../../store/messages/const/messageTypes';

import { Message } from './Message.component';

storiesOf('Message', module).add('Default', () => {
  return (
    <Message
      message={{
        id: '1',
        type: MessageTypes.BASIC,
        message:
          'Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.',
        createdAt: '1:30pm',
        nickname: 'holmes',
      }}
    />
  );
});
