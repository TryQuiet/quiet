
import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { CreateCommunity } from './CreateCommunity.component'

storiesOf('CreateCommunity', module)
  .add('Default', () => <CreateCommunity createCommunityAction={storybookLog('Creating community!')} />)
