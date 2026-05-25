import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../../utils/functions/storybookLog/storybookLog.function'

import { JoiningOptIn } from './JoiningOptIn.component'

storiesOf('JoiningOptIn', module).add('Default', () => (
  <JoiningOptIn visible={true} onClose={storybookLog('Joining opt-in closed')} />
))
