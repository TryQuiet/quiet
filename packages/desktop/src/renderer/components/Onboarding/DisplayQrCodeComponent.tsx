import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import QR from 'react-qr-code'

import { ActionProgress } from '../ui/ActionProgress/ActionProgress'

const PREFIX = 'DisplayQrCodeComponent'

const classes = {
  box: `${PREFIX}box`,
  boxText: `${PREFIX}boxText`,
  copy: `${PREFIX}copy`,
}

/** The library's qr-code-box (5996:24052): 220 square, 1px #B3B3B3, r4, the 188 code inset 16. */
export const QR_BOX_SIZE = 220
export const QR_SIZE = 188

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.space.lg,
  [`& .${classes.box}`]: {
    boxSizing: 'border-box',
    flexShrink: 0,
    width: QR_BOX_SIZE,
    height: QR_BOX_SIZE,
    padding: (QR_BOX_SIZE - QR_SIZE) / 2 - 1,
    border: `1px solid ${theme.palette.colors.border02}`,
    borderRadius: theme.space.xs,
    backgroundColor: theme.palette.colors.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  [`& .${classes.boxText}`]: {
    textAlign: 'center',
    color: theme.palette.colors.darkGray,
  },
  [`& .${classes.copy}`]: {
    textAlign: 'center',
  },
}))

/** Sheet copy (2811:2601), verbatim. */
export const DISPLAY_QR_CODE_COPY = {
  scan: 'Scan this from “Link devices” on another device to link the devices.',
  /** While the backend mints the link (#3400's copy; the frames draw no such state) — the ActionProgress status line. */
  generating: 'Generating device link…',
  /** No community to mint a link from (#3400's copy; the frames draw no such state). */
  unavailable: 'Device link unavailable',
  /**
   * The fine print (user's copy, #3690). It names no lifetime: the device invite's expiry is
   * checked against the admitting member's own ADMIT timestamp, so a colluding member can
   * backdate past it and the app cannot promise one.
   */
  security: 'Anyone who has this QR code can link your device and access community history.',
} as const

export interface DisplayQrCodeComponentProps {
  /** The device link; empty while it is being minted, or when none can be minted. */
  deviceLink: string
  isLoading: boolean
  dataTestId?: string
}

/**
 * Link devices — QR code (2811:2601; desktop 880:17427), drawn in the Settings panel under
 * Linked devices, as the invite QR code is under QR Code (#3690): the panel scrolls, so the
 * code keeps the designed box at any window size. The QR, the sheet's sentence and the fine
 * print, and no action: the raw link is never shown, the Linked devices panel's own Copy link
 * row copies it, and the frame's Reset QR code link is not drawn (user decisions, #3690).
 * While the link is minted the library's progress bar shows with the status line
 * (ActionProgress, #3518); without a community the box says there is no link.
 */
export const DisplayQrCodeComponent: React.FC<DisplayQrCodeComponentProps> = ({
  deviceLink,
  isLoading,
  dataTestId = 'display-qr-code',
}) => {
  const ready = Boolean(deviceLink)
  return (
    <Root data-testid={dataTestId}>
      <div className={classes.box} data-testid={`${dataTestId}-box`}>
        {ready ? <QR value={deviceLink} size={QR_SIZE} data-testid={`${dataTestId}-qr`} /> : null}
        {!ready && !isLoading ? (
          <Typography variant='body2' className={classes.boxText} role='status' data-testid={`${dataTestId}-status`}>
            {DISPLAY_QR_CODE_COPY.unavailable}
          </Typography>
        ) : null}
      </div>
      <Typography variant='body2' className={classes.copy} component='p'>
        {DISPLAY_QR_CODE_COPY.scan}
      </Typography>
      <Typography variant='caption' align='center' data-testid={`${dataTestId}-security`}>
        {DISPLAY_QR_CODE_COPY.security}
      </Typography>
      {isLoading && !ready ? (
        <ActionProgress status={DISPLAY_QR_CODE_COPY.generating} data-testid={`${dataTestId}-progress`} />
      ) : null}
    </Root>
  )
}

export default DisplayQrCodeComponent
