import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CopyToClipboard from 'react-copy-to-clipboard'
import QR from 'react-qr-code'

import { ActionProgress } from '../ui/ActionProgress/ActionProgress'
import { ConfirmationToast } from '../ui/ConfirmationToast/ConfirmationToast'
import { LoadingButton } from '../ui/LoadingButton/LoadingButton'
import { OnboardingBody } from './OnboardingBody'
import { TextLink } from './OpenInviteLinkComponent'

const PREFIX = 'DisplayQrCodeComponent'

const classes = {
  box: `${PREFIX}box`,
  boxText: `${PREFIX}boxText`,
  copy: `${PREFIX}copy`,
  button: `${PREFIX}button`,
  reset: `${PREFIX}reset`,
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
  // The Add members QR sheet's primary button (2932:3707 "Button"): 50 tall, r16, padding 20, hug width, 16/26 label.
  [`& .${classes.button}`]: {
    minWidth: 0,
    maxWidth: 'none',
    height: 50,
    padding: `${theme.space.md}px 20px`,
    borderRadius: 16,
    backgroundColor: theme.palette.colors.quietBlue,
    color: theme.palette.colors.white,
    textTransform: 'none',
    fontSize: 16,
    fontWeight: 400,
  },
  [`& .${classes.reset}`]: {
    color: theme.palette.colors.blue02,
  },
}))

/** Sheet copy (2811:2601), verbatim. */
export const DISPLAY_QR_CODE_COPY = {
  scan: 'Scan this from “Link devices” on another device to link the devices.',
  copyLink: 'Copy link',
  reset: 'Reset QR code',
  /** The confirmation after Copy link. Not in a frame. */
  copied: 'Link copied',
  /** While the backend mints the link (#3400's copy; the frames draw no such state) — the ActionProgress status line. */
  generating: 'Generating device link…',
  /** No community to mint a link from (#3400's copy; the frames draw no such state). */
  unavailable: 'Device link unavailable',
  /**
   * develop's security copy, kept verbatim. It is the only place that says what the link actually
   * is: reusable until it expires, not a one-shot code — and that expiry does not take back keys
   * a linked device already holds. The frames have no such paragraph, and dropping it would leave
   * people to guess at the risk.
   */
  security:
    'This link can be used by more than one device until it expires after 30 minutes. Anyone who keeps the link and a copy of the community history may retain historical encryption keys after it expires or is revoked.',
} as const

export interface DisplayQrCodeComponentProps {
  /** The device link; empty while it is being minted, or when none can be minted. */
  deviceLink: string
  isLoading: boolean
  /** Reset QR code: invalidate the current link and mint another. */
  onReset: () => void
  dataTestId?: string
}

/**
 * Link devices — QR code (2811:2601; desktop 880:17427): the QR in the designed box, the
 * sheet's sentence, then — the user's decision (2026-09-13), in the slot the Add members
 * QR sheet gives its primary button — Copy link, and Reset QR code as a text link. The
 * raw link is never shown; Copy link puts it on the clipboard and confirms briefly.
 * While the link is minted the actions give way to the library's progress bar with the
 * status line (ActionProgress, #3518's rule: never a greyed-out button); without a
 * community there is nothing to act on, so the box says so and no action is drawn.
 */
export const DisplayQrCodeComponent: React.FC<DisplayQrCodeComponentProps> = ({
  deviceLink,
  isLoading,
  onReset,
  dataTestId = 'display-qr-code',
}) => {
  const [copied, setCopied] = useState(false)
  const ready = Boolean(deviceLink)
  return (
    <OnboardingBody dataTestId={dataTestId}>
      <Root>
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
        {ready ? (
          <>
            <CopyToClipboard text={deviceLink} onCopy={() => setCopied(true)}>
              <LoadingButton
                variant='contained'
                size='small'
                color='primary'
                text={DISPLAY_QR_CODE_COPY.copyLink}
                classes={{ button: classes.button }}
                data-testid='copy-device-link'
              />
            </CopyToClipboard>
            <TextLink type='button' onClick={onReset} className={classes.reset} data-testid='reset-qr-code'>
              <Typography variant='body1' component='span' color='inherit'>
                {DISPLAY_QR_CODE_COPY.reset}
              </Typography>
            </TextLink>
          </>
        ) : null}
      </Root>
      <ConfirmationToast
        open={copied}
        message={DISPLAY_QR_CODE_COPY.copied}
        onClose={() => setCopied(false)}
        data-testid='link-copied'
      />
    </OnboardingBody>
  )
}

export default DisplayQrCodeComponent
