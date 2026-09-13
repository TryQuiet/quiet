import React, { type FC } from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import type { LinkedDevicesComponentProps } from './LinkedDevices.types'
import { DisplayQrCodeComponent } from '../../../Onboarding/DisplayQrCodeComponent'
import { LinkedDevicesList } from '../../../Onboarding/LinkedDevicesList'
import { CONTENT_COLUMN_WIDTH } from '../../../Onboarding/OnboardingBody'

const PREFIX = 'LinkedDevices'

const classes = {
  title: `${PREFIX}title`,
  column: `${PREFIX}column`,
}

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  [`& .${classes.title}`]: {
    marginBottom: theme.space.sm,
  },
  // The onboarding column (375) hosts the same QR sheet and list the Link devices modal shows.
  [`& .${classes.column}`]: {
    width: '100%',
    maxWidth: CONTENT_COLUMN_WIDTH,
  },
}))

/**
 * Settings → Linked devices: the QR code sheet's content (2811:2601 — the QR in the
 * designed box, Copy link, Reset QR code) and the Linked devices list, the same
 * components as Link devices in onboarding, so the two surfaces match.
 */
export const LinkedDevicesComponent: FC<LinkedDevicesComponentProps> = ({
  deviceLink,
  isLoading,
  onReset,
  linkedDevices,
}) => (
  <Root>
    <Typography variant='h3' className={classes.title} data-testid='linked-devices-title'>
      Linked devices
    </Typography>
    <div className={classes.column}>
      <DisplayQrCodeComponent
        deviceLink={deviceLink}
        isLoading={isLoading}
        onReset={onReset}
        dataTestId='settings-qr-code'
      />
      <LinkedDevicesList devices={linkedDevices} />
    </div>
  </Root>
)
