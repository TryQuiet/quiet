import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { ServerOffer } from './ServerOffer.component'

// Scenario names are ids: the Detox storybook suite only matches single-quoted `.add('…'`
// and turns the name into a screenshot filename (serveroffer--default.png).
storiesOf('ServerOffer', module)
  // The offer as the app shows it during community creation.
  .add('default', () => (
    <ServerOffer
      onClose={storybookLog('Server offer decided')}
      onBack={storybookLog('Server offer went back')}
      showDontShowAgain={false}
    />
  ))
  // The frame in full (2922:10009): the rule and the checkbox below the actions.
  .add('with-checkbox', () => (
    <ServerOffer
      onClose={storybookLog('Server offer decided')}
      onBack={storybookLog('Server offer went back')}
      showDontShowAgain={true}
    />
  ))
  // The same with the box ticked.
  .add('checkbox-checked', () => (
    <ServerOffer
      onClose={storybookLog('Server offer decided')}
      onBack={storybookLog('Server offer went back')}
      showDontShowAgain={true}
      defaultDontShowAgain={true}
    />
  ))
