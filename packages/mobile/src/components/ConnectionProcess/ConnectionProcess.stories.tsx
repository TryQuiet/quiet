import { ConnectionProcessInfo } from '@quiet/types'
import { storiesOf } from '@storybook/react-native'
import React from 'react'
import ConnectionProcessComponent from './ConnectionProcess.component'
import { createLogger } from '../../utils/logger'

const logger = createLogger('connectionProcess:stories')

storiesOf('ConnectionProcess', module)
  .add('Default', () => (
    <ConnectionProcessComponent
      connectionProcess={{
        number: 50,
        text: ConnectionProcessInfo.CONNECTING_TO_COMMUNITY,
      }}
      openUrl={() => logger.info('open')}
    />
  ))
  .add('With Share logs link (dev/alpha)', () => (
    // The "Share logs" link is gated to non-production builds via Config.NODE_ENV.
    // When running Storybook with NODE_ENV=storybook (or any non-production value),
    // the link will render below "Learn more about Tor and Quiet" and tapping it
    // bundles cached log files and opens the native share sheet via sendLogs().
    <ConnectionProcessComponent
      connectionProcess={{
        number: 50,
        text: ConnectionProcessInfo.CONNECTING_TO_COMMUNITY,
      }}
      openUrl={() => logger.info('open')}
    />
  ))
  .add('With Share all data link (dev/alpha)', () => (
    // The "Share all data" link is gated to non-production builds via Config.NODE_ENV.
    // When running Storybook with NODE_ENV=storybook (or any non-production value),
    // the link will render below "Share logs" and tapping it zips the local Quiet
    // data directory plus on-device logs and opens the native share sheet via
    // shareAllData(). The archive's README.txt header carries a strong privacy
    // warning since the data dir contains identity private keys.
    <ConnectionProcessComponent
      connectionProcess={{
        number: 50,
        text: ConnectionProcessInfo.CONNECTING_TO_COMMUNITY,
      }}
      openUrl={() => logger.info('open')}
    />
  ))
