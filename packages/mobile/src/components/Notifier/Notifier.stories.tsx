import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { icons } from '../../assets'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { Notifier } from './Notifier.component'

storiesOf('Notifier', module).add('Default', () => (
  <Notifier
    onButtonPress={storybookLog('button pressed')}
    onEmailPress={storybookLog('email pressed')}
    icon={icons.update_graphics}
    title={'Coming update will remove communities & messages'}
    message={
      'Quiet’s next release makes joining communities faster and more reliable by letting people join when the owner is offline! However, these changes required us to reset all communities, and both communities and messages will be lost on mobile. We apologize for the inconvenience, and please reach out immediately if you need help backing up messages.'
    }
  />
))
