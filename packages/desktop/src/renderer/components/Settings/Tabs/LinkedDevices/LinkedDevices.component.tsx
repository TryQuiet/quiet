import React, { type FC } from 'react'
import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import CopyToClipboard from 'react-copy-to-clipboard'
import QR from 'react-qr-code'

import type { LinkedDevicesComponentProps } from './LinkedDevices.types'

const PREFIX = 'LinkedDevices'

const classes = {
  button: `${PREFIX}button`,
  code: `${PREFIX}code`,
  description: `${PREFIX}description`,
  link: `${PREFIX}link`,
  linkContainer: `${PREFIX}linkContainer`,
  linkVisibility: `${PREFIX}linkVisibility`,
  title: `${PREFIX}title`,
  list: `${PREFIX}list`,
  listLabel: `${PREFIX}listLabel`,
  device: `${PREFIX}device`,
  empty: `${PREFIX}empty`,
  centered: `${PREFIX}centered`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.title}`]: {
    marginBottom: 24,
  },
  [`& .${classes.description}`]: {
    marginTop: 8,
  },
  [`& .${classes.code}`]: {
    alignSelf: 'center',
    marginTop: 24,
  },
  [`& .${classes.linkContainer}`]: {
    alignItems: 'baseline',
    display: 'flex',
    flexDirection: 'row',
    maxWidth: 375,
    position: 'relative',
  },
  [`& .${classes.link}`]: {
    fontSize: 13,
    inlineSize: 'calc(100% - 40px)',
    letterSpacing: '-0.4px',
    marginTop: 16,
    overflowWrap: 'break-word',
  },
  [`& .${classes.linkVisibility}`]: {
    margin: 5,
    position: 'absolute',
    right: 0,
    top: 8,
  },
  [`& .${classes.list}`]: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.space.sm,
    marginTop: theme.space.xl,
  },
  [`& .${classes.listLabel}`]: {
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
  [`&.${classes.centered}`]: {
    alignItems: 'center',
    textAlign: 'center',
    [`& .${classes.linkContainer}`]: {
      width: '100%',
    },
    [`& .${classes.list}`]: {
      width: '100%',
    },
  },
  [`& .${classes.button}`]: {
    backgroundColor: theme.palette.colors.quietBlue,
    color: theme.palette.colors.white,
    height: 60,
    marginTop: 24,
    textTransform: 'none',
    width: '100%',
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue,
      opacity: 0.7,
    },
  },
}))

const HIDDEN_DEVICE_LINK = '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'

export const LinkedDevicesComponent: FC<LinkedDevicesComponentProps> = ({
  deviceLink,
  isLoading,
  revealLink,
  onToggleLinkVisibility,
  linkedDevices,
  centered = false,
}) => {
  const otherDevices = (linkedDevices ?? []).filter(device => !device.isCurrent && device.removedAt == null)
  return (
    <StyledGrid container direction='column' className={centered ? classes.centered : undefined}>
      <Grid item className={classes.title}>
        <Typography variant='h3' data-testid='linked-devices-title'>
          Linked devices
        </Typography>
      </Grid>
      {!deviceLink ? (
        <>
          <Grid item>
            <Typography variant='h5'>{isLoading ? 'Generating device link…' : 'Device link unavailable'}</Typography>
          </Grid>
          <Grid item className={classes.description}>
            <Typography variant='body2'>
              {isLoading
                ? 'Quiet is creating a private, one-time link for your other device.'
                : 'Make sure this device is connected to the community, then close and reopen Linked devices to try again.'}
            </Typography>
          </Grid>
        </>
      ) : (
        <>
          <Grid item>
            <Typography variant='h5'>Link a new device</Typography>
            <Typography variant='body2' className={classes.description}>
              Scan this QR code with Quiet on the device you want to link. Keep both devices online until linking
              finishes.
            </Typography>
          </Grid>
          <Grid item className={classes.code}>
            <QR value={deviceLink} size={172} />
          </Grid>
          <Grid item className={classes.description}>
            <Typography variant='body2'>
              This one-time link expires after 30 minutes. Only share it with a device you control.
            </Typography>
          </Grid>
          <Grid item className={classes.linkContainer}>
            <Typography variant='body2' className={classes.link} data-testid='device-link'>
              {revealLink ? deviceLink : HIDDEN_DEVICE_LINK}
            </Typography>
            <IconButton
              data-testid='show-device-link'
              size='small'
              onClick={onToggleLinkVisibility}
              className={classes.linkVisibility}
            >
              {revealLink ? (
                <Visibility color='primary' fontSize='small' />
              ) : (
                <VisibilityOff color='primary' fontSize='small' />
              )}
            </IconButton>
          </Grid>
          <Grid item>
            <CopyToClipboard text={deviceLink}>
              <Button data-testid='copy-device-link' className={classes.button}>
                Copy to clipboard
              </Button>
            </CopyToClipboard>
          </Grid>
        </>
      )}
      <Grid item className={classes.list} data-testid='linked-devices-list'>
        <Typography variant='overline' className={classes.listLabel}>
          Linked devices
        </Typography>
        {otherDevices.length === 0 ? (
          <Typography variant='body2' className={classes.empty} data-testid='no-linked-devices'>
            No linked devices
          </Typography>
        ) : (
          otherDevices.map(device => (
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
      </Grid>
    </StyledGrid>
  )
}
