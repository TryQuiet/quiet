import {storiesOf} from '@storybook/react-native';
import React from 'react';

import {Message} from './Message.component';

storiesOf('Message', module).add('Default', () => (
  <Message
    nickname={'holmes'}
    datetime={'1.55pm'}
    message={{
      id: '',
      type: 0,
      typeIndicator: 0,
      message:
        'Message text. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt.',
      createdAt: 0,
      r: 0,
      channelId: '',
      signature: '',
    }}
  />
));
