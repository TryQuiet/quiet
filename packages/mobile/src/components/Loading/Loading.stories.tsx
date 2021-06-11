import { storiesOf } from '@storybook/react-native';
import React from 'react';

import { Loading } from './Loading.component';

storiesOf('Loading', module)
  .add('Default', () => (
    <Loading
      progress={0.3}
      description={'Downloading tools to protect your privacy'}
      checks={[
        {
          event: 'native services started',
          passed: true,
        },
        {
          event: 'tor initialized',
          passed: true,
        },
        {
          event: 'onion address added',
          passed: false,
        },
        {
          event: 'waggle started',
          passed: false,
        },
        {
          event: 'websocket connected',
          passed: false,
        },
      ]}
    />
  ))
  .add('< 0', () => (
    <Loading
      progress={0}
      description={'Downloading tools to protect your privacy'}
    />
  ))
  .add('> 99', () => (
    <Loading
      progress={1}
      description={'Downloading tools to protect your privacy'}
    />
  ));
