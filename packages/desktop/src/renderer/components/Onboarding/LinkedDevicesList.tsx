import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import type { LinkedDevice } from '@quiet/types'

import { tokens } from '../../design-system/tokens'

const PREFIX = 'LinkedDevicesList'

const classes = {
  label: `${PREFIX}label`,
  card: `${PREFIX}card`,
  device: `${PREFIX}device`,
  empty: `${PREFIX}empty`,
}

/**
 * The "Linked devices" list the Link devices frames draw under the rows
 * (2811:2575's hidden nodes; mobile states 879:15640 / 879:15644): an overline
 * header over the library's bordered card. The empty line is the frame's own
 * #767676, a step darker than the header.
 */
const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.space.sm,
  [`& .${classes.label}`]: {
    color: theme.palette.colors.darkGray,
  },
  [`& .${classes.card}`]: {
    border: `1px solid ${theme.palette.colors.border04}`,
    borderRadius: tokens.radii[3],
    overflow: 'hidden',
  },
  [`& .${classes.device}`]: {
    padding: `${theme.space.sm}px ${theme.space.lg}px`,
    borderBottom: `1px solid ${theme.palette.colors.border01}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  [`& .${classes.empty}`]: {
    color: theme.palette.colors.gray60,
    padding: `${theme.space.sm}px ${theme.space.lg}px`,
  },
}))

/**
 * The rows the list draws: the other devices on this account. This device is
 * never one of them (it is the one being read from), and a device removed from
 * the account is gone from the list even though the graph still carries it.
 * Rows are keyed and identified by `deviceId`; only the name is displayed, and
 * names are not guaranteed unique.
 */
export const otherLinkedDevices = (linkedDevices: LinkedDevice[]): LinkedDevice[] =>
  linkedDevices.filter(device => !device.isCurrent && device.removedAt == null)

export interface LinkedDevicesListProps {
  /**
   * The current user's devices, as read from the backend. `undefined` means no
   * read has come back yet, and nothing is drawn: saying "No linked devices"
   * before the answer arrives would state something the app does not know.
   */
  linkedDevices?: LinkedDevice[]
}

export const LinkedDevicesList: React.FC<LinkedDevicesListProps> = ({ linkedDevices }) => {
  if (!linkedDevices) return null
  const devices = otherLinkedDevices(linkedDevices)
  return (
    <Root data-testid='linked-devices-list'>
      {/* The frame draws this overline with the same words as a Linked devices
          heading elsewhere, so it carries a testid: querying it by text would be
          ambiguous with the heading. */}
      <Typography variant='overline' className={classes.label} data-testid='linked-devices-list-label'>
        Linked devices
      </Typography>
      <div className={classes.card}>
        {devices.length === 0 ? (
          <Typography variant='body2' className={classes.empty} data-testid='no-linked-devices'>
            No linked devices
          </Typography>
        ) : (
          devices.map(device => (
            <Typography
              variant='body1'
              className={classes.device}
              key={device.deviceId}
              data-testid={`linked-device-${device.deviceId}`}
            >
              {device.deviceName}
            </Typography>
          ))
        )}
      </div>
    </Root>
  )
}

export default LinkedDevicesList
