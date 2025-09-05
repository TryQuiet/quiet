import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { ServerOffer } from './CreatingOffer/ServerOffer.component'

storiesOf('ServerOffer', module).add('Default', () => (
  <ServerOffer
    visible={true}
    onClose={storybookLog('Server offer closed')}
    handleDontShowAgainChange={storybookLog('Dont show again toggled')}
    showDontShowAgain={true}
  />
))
