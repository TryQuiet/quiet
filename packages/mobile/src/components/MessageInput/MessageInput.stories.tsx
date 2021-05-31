import { storiesOf } from '@storybook/react-native';
import React from 'react';

import { MessageInput } from './MessageInput.component';

storiesOf('MessageInput', module).add('Default', () => (
  <MessageInput placeholder={'Message #general as @holmes'} />
));
