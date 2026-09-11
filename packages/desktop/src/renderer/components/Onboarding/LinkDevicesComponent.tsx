import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import { ActionRow } from './ActionRow'
import { OnboardingBody, RowGroup } from './OnboardingBody'
import { onboardingIcons } from './icons'

const PREFIX = 'LinkDevicesComponent'

const classes = {
  sectionLabel: `${PREFIX}sectionLabel`,
  device: `${PREFIX}device`,
  empty: `${PREFIX}empty`,
}

const DeviceList = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.space.sm,
  [`& .${classes.sectionLabel}`]: {
    color: theme.palette.colors.darkGray,
  },
  [`& .${classes.device}`]: {
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.sm,
    borderBottom: `1px solid ${theme.palette.colors.border01}`,
  },
  [`& .${classes.empty}`]: {
    color: theme.palette.colors.darkGray,
  },
}))

export interface LinkedDeviceRow {
  deviceId: string
  deviceName: string
  isCurrent: boolean
}

export interface LinkDevicesComponentProps {
  onDisplayQrCode: () => void
  onScanQrCode: () => void
  /** Devices linked to this user; undefined while unknown. */
  linkedDevices?: LinkedDeviceRow[]
}

/** Link devices · Figma 2811:2575. */
export const LinkDevicesComponent: React.FC<LinkDevicesComponentProps> = ({
  onDisplayQrCode,
  onScanQrCode,
  linkedDevices,
}) => {
  const others = (linkedDevices ?? []).filter(device => !device.isCurrent)
  return (
    <OnboardingBody
      heading={'Link devices'}
      intro={
        'Display the QR code on one device and scan it with another. Linked devices share all communities, and you will not lose access to anything.'
      }
      dataTestId='link-devices'
    >
      <RowGroup>
        <ActionRow
          icon={onboardingIcons.qrDisplay}
          label={'Display QR code'}
          onClick={onDisplayQrCode}
          dataTestId='link-devices-display-qr'
        />
        <ActionRow
          icon={onboardingIcons.qrScan}
          label={'Scan QR code'}
          onClick={onScanQrCode}
          dataTestId='link-devices-scan-qr'
        />
      </RowGroup>
      <DeviceList data-testid='linked-devices-list'>
        <Typography variant='overline' className={classes.sectionLabel}>
          Linked devices
        </Typography>
        {others.length === 0 ? (
          <Typography variant='body2' className={classes.empty} data-testid='no-linked-devices'>
            No linked devices
          </Typography>
        ) : (
          others.map(device => (
            <Typography
              variant='body1'
              className={classes.device}
              key={device.deviceId}
              data-testid={`linked-device-${device.deviceName}`}
            >
              {device.deviceName}
            </Typography>
          ))
        )}
      </DeviceList>
    </OnboardingBody>
  )
}

export default LinkDevicesComponent
