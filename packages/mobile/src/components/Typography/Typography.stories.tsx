import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { Typography } from './Typography.component'

storiesOf('Typography', module)
  .add('Default', () => <Typography fontSize={25}>{'This is random text'}</Typography>)
  .add('Bold', () => (
    <Typography fontSize={20} fontWeight={'bold'}>
      {'This is random text'}
    </Typography>
  ))
  .add('Thin', () => (
    <Typography fontSize={20} fontWeight={'thin'}>
      {'This is random text'}
    </Typography>
  ))
