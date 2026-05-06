import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { icons } from '../../assets'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { Success } from './Success.component'

storiesOf('Success', module).add('Default', () => (
  <Success
    onPress={storybookLog('username registered')}
    icon={icons.username_registered}
    title={'You created a username'}
    message={'Your username will be registered shortly'}
  />
))
