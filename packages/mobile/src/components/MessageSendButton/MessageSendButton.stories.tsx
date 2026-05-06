import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { MessageSendButton } from './MessageSendButton.component'

storiesOf('MessageSendButton', module)
  .add('Default', () => <MessageSendButton onPress={storybookLog('Enabled button click')} disabled={false} />)
  .add('Disabled', () => <MessageSendButton onPress={storybookLog('Disabled button click')} disabled={true} />)
