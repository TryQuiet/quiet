import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'
import NewUsernameRequestedComponent from './NewUsernameRequested.component'

storiesOf('NewUsernameRequested', module).add('Default', () => (
  <NewUsernameRequestedComponent handler={storybookLog('clicked')} />
))
