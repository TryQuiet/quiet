import React from 'react'
import { storiesOf } from '@storybook/react-native'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'
import { Button } from './Button.component'

storiesOf('Button', module)
  .add('Default', () => <Button title={'button'} onPress={storybookLog('Button clicked')} />)
  .add('New', () => <Button title={'button'} onPress={storybookLog('Button clicked')} newDesign />)
  .add('Negative', () => <Button title={"Never mind, I'll stay"} onPress={storybookLog('Button clicked')} negative />)
  .add('Disabled', () => <Button title={"Never mind, I'll stay"} onPress={storybookLog('Button clicked')} disabled />)
