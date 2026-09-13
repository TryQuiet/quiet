import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import { tokens } from '../../design-system/tokens'

const PREFIX = 'LinkedDevicesList'

const classes = {
  heading: `${PREFIX}heading`,
  card: `${PREFIX}card`,
  row: `${PREFIX}row`,
  empty: `${PREFIX}empty`,
}

/**
 * The "Linked devices" section of Link devices — the frame's hidden nodes (2811:2575
 * "Header heading" + "Container"), drawn in the Device-linking desktop frames 879:20987 /
 * 880:17196: an overline heading (10/16 #7F7F7F, 32 above / 8 below) over a bordered card
 * (1px #E5E5E5, r16). Empty: "No linked devices" 14/20 #767676 centred, padded 16. With
 * devices: one 65-tall row per device, name 16 over "Active" 12/16 #7F7F7F, hairlines
 * between. The frames' trash glyph is not drawn: #3400 ships no device removal.
 */
const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  [`& .${classes.heading}`]: {
    color: theme.palette.colors.darkGray,
    // The body's gap (24) plus this (24) is the frame's 32 heading + 16 container padding.
    paddingTop: theme.space.xl,
    paddingBottom: theme.space.sm,
  },
  [`& .${classes.card}`]: {
    border: `1px solid ${theme.palette.colors.border04}`,
    borderRadius: tokens.radii[3],
    overflow: 'hidden',
  },
  [`& .${classes.row}`]: {
    padding: `${theme.space.md}px ${theme.space.lg}px`,
    borderBottom: `1px solid ${theme.palette.colors.border01}`,
    '&:last-child': {
      borderBottom: 'none',
    },
    '& .MuiTypography-caption': {
      color: theme.palette.colors.darkGray,
    },
  },
  [`& .${classes.empty}`]: {
    padding: theme.space.lg,
    textAlign: 'center',
    color: theme.palette.colors.gray60,
  },
}))

export interface LinkedDeviceRow {
  deviceId: string
  deviceName: string
  isCurrent: boolean
  /** Set once the device was removed from the team; such devices are not listed. */
  removedAt?: number | null
}

export interface LinkedDevicesListProps {
  /** Devices linked to this user; undefined while unknown. This device is not listed. */
  devices?: LinkedDeviceRow[]
  dataTestId?: string
}

export const LinkedDevicesList: React.FC<LinkedDevicesListProps> = ({
  devices,
  dataTestId = 'linked-devices-list',
}) => {
  const others = (devices ?? []).filter(device => !device.isCurrent && device.removedAt == null)
  return (
    <Root data-testid={dataTestId}>
      <Typography variant='overline' className={classes.heading} component='div'>
        Linked devices
      </Typography>
      <div className={classes.card}>
        {others.length === 0 ? (
          <Typography variant='body2' className={classes.empty} data-testid='no-linked-devices'>
            No linked devices
          </Typography>
        ) : (
          others.map(device => (
            <div className={classes.row} key={device.deviceId} data-testid={`linked-device-${device.deviceName}`}>
              <Typography variant='body1'>{device.deviceName}</Typography>
              <Typography variant='caption' component='div'>
                Active
              </Typography>
            </div>
          ))
        )}
      </div>
    </Root>
  )
}

export default LinkedDevicesList
