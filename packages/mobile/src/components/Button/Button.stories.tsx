import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { Button } from './Button.component'

storiesOf('Button', module)
  .add('Default', () => (
    <Button title={'button'} onPress={storybookLog('Button clicked')} />
  ))
  .add('Loading', () => (
    <Button
      title={'button'}
      onPress={storybookLog('Button clicked')}
      loading={true}
    />
  ))
  .add('Negative', () => (
    <Button
      title={'Never mind, I\'ll stay'}
      onPress={storybookLog('Button clicked')}
      negative
    />
  ))
