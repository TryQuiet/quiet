import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { ServerOffer } from './ServerOffer.component'

storiesOf('ServerOffer', module)
  // The offer as the app shows it during community creation.
  .add('Want a server?', () => (
    <ServerOffer visible={true} onClose={storybookLog('Server offer closed')} showDontShowAgain={false} />
  ))
  // The frame in full (2922:10009): the rule and the checkbox below the actions.
  .add("With Don't show this again", () => (
    <ServerOffer visible={true} onClose={storybookLog('Server offer closed')} showDontShowAgain={true} />
  ))
