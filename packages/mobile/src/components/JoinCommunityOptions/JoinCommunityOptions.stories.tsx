import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'
import { JoinCommunityOptions } from './JoinCommunityOptions.component'
import { JOIN_WITH_INVITE_LINK_HEADING, JOIN_WITH_QR_CODE_HEADING, RECOVER_ACCOUNT_HEADING } from '@quiet/common'

storiesOf('JoinCommunityOptions', module).add('Default', () => (
  <JoinCommunityOptions
    onJoinWithInviteLink={storybookLog(JOIN_WITH_INVITE_LINK_HEADING)}
    onJoinWithQrCode={storybookLog(JOIN_WITH_QR_CODE_HEADING)}
    onRecoverAccount={storybookLog(RECOVER_ACCOUNT_HEADING)}
    handleBackButton={storybookLog('Back to Get started')}
  />
))
