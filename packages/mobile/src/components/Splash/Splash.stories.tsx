import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { Splash } from './Splash.component'

storiesOf('Splash', module)
  .add('Default', () => <Splash />)
  .add('With Share logs / Share all data links (dev/alpha)', () => (
    // The "Share logs" and "Share all data" links are gated to non-production
    // builds via Config.NODE_ENV. Running Storybook with any non-production
    // NODE_ENV renders both links below the version string. Tapping "Share
    // logs" bundles cached log files; "Share all data" zips the local Quiet
    // data directory plus on-device logs. Both open the native share sheet.
    <Splash />
  ))
