import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { appImages } from '../../assets'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { Success } from './Success.component'

storiesOf('Success', module).add('Default', () => (
  <Success
    onPress={storybookLog('username registered')}
    icon={appImages.username_registered}
    title={'You created a username'}
    message={'Your username will be registered shortly'}
  />
))
