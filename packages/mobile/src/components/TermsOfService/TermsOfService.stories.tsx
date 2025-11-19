import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { TermsOfService } from './TermsOfService.component'

storiesOf('TermsOfService', module).add('Default', () => (
  <TermsOfService
    onAgree={storybookLog('Agreed to terms!')}
    onBack={storybookLog('Navigated back!')}
    onLeave={storybookLog('Chose to leave community!')}
  />
))
