import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { UsernameRegistration } from './UsernameRegistration.component'

storiesOf('UsernameRegistration', module).add('Default', () => (
  <UsernameRegistration registerUsernameAction={storybookLog('Username registered!')} usernameRegistered={false} />
))
