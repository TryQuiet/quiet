import React, { useCallback, useState } from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import type { InvitationData } from '@quiet/types'

import { InviteLinkErrors } from '../../../forms/fieldsErrors'
import { OnboardingBody } from '../OnboardingBody'
import { TextLink } from '../OpenInviteLinkComponent'
import { parseScannedCode } from './decodeQr'
import { useQrScanner, type QrScannerStatus } from './useQrScanner'
import { PASTE_A_LINK_LABEL } from '@quiet/common'

const PREFIX = 'QrScannerComponent'

const classes = {
  video: `${PREFIX}video`,
  frame: `${PREFIX}frame`,
  overlay: `${PREFIX}overlay`,
  message: `${PREFIX}message`,
  error: `${PREFIX}error`,
}

/** The camera area of the prototype's sheets (2811:2460, 2811:2587): the column's full width, 375×384. */
export const VIEWFINDER_ASPECT_RATIO = '375 / 384'
/** The framed square the code is held in (≈215 in the frames). */
export const TARGET_SIZE = 216

const Viewfinder = styled('div', { shouldForwardProp: prop => prop !== 'flush' })<{ flush: boolean }>(
  ({ theme, flush }) => ({
    position: 'relative',
    // The frames run the camera edge to edge; the body's side padding is undone here, and
    // its top padding too when nothing sits between the title bar and the camera (2811:2460).
    marginLeft: -theme.space.lg,
    marginRight: -theme.space.lg,
    marginTop: flush ? -theme.space.xl : 0,
    aspectRatio: VIEWFINDER_ASPECT_RATIO,
    backgroundColor: theme.palette.colors.trueBlack,
    overflow: 'hidden',
    [`& .${classes.video}`]: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    [`& .${classes.frame}`]: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: TARGET_SIZE,
      height: TARGET_SIZE,
      transform: 'translate(-50%, -50%)',
      borderRadius: theme.space.sm,
      border: `1px solid rgba(255, 255, 255, 0.8)`,
      backgroundColor: 'rgba(255, 255, 255, 0.35)',
      pointerEvents: 'none',
    },
    [`& .${classes.overlay}`]: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.space.md,
      padding: theme.space.xl,
      textAlign: 'center',
      color: theme.palette.colors.white,
    },
  })
)

const ErrorText = styled(Typography)(({ theme }) => ({
  color: theme.palette.colors.red,
  textAlign: 'center',
}))

export interface QrScannerComponentProps {
  /** Copy between the title bar and the camera (the Link devices sheet has one; Join with QR code has none). */
  intro?: React.ReactNode
  /** A scanned Quiet invitation, member or device, parsed exactly as a pasted link is. */
  onDecoded: (data: InvitationData) => void
  /** Route to the paste field when the camera cannot be used. */
  onUsePasteLink: () => void
  dataTestId?: string
}

/**
 * Not in the prototype: the sheets show only the camera. The permission-pending,
 * denied and no-camera states below are the minimum needed to say what happened and
 * offer the paste field instead; their copy is not the designer's.
 */
export const SCANNER_COPY = {
  requesting: 'Requesting camera access…',
  denied: 'Camera access was denied.',
  unavailable: 'No camera is available.',
  /** The Open invite link frame's own link text. */
  pasteLink: PASTE_A_LINK_LABEL,
} as const

const BLOCKED: QrScannerStatus[] = ['denied', 'unavailable']

/**
 * Join with QR code (2811:2460) and Scan QR code (2811:2587): the camera fills the
 * column, the code is held in the framed square. A decoded code is validated by the
 * paste field's parser; an invalid one shows the paste field's error and scanning
 * continues.
 */
export const QrScannerComponent: React.FC<QrScannerComponentProps> = ({
  intro,
  onDecoded,
  onUsePasteLink,
  dataTestId = 'qr-scanner',
}) => {
  const [invalid, setInvalid] = useState(false)

  const onCode = useCallback(
    (text: string) => {
      const data = parseScannedCode(text)
      if (!data) {
        setInvalid(true)
        return false
      }
      setInvalid(false)
      onDecoded(data)
      return true
    },
    [onDecoded]
  )

  const { videoRef, status } = useQrScanner({ onCode })
  const blocked = BLOCKED.includes(status)

  return (
    <OnboardingBody intro={intro} dataTestId={dataTestId}>
      <Viewfinder flush={!intro} data-testid={`${dataTestId}-viewfinder`} data-status={status}>
        <video ref={videoRef} className={classes.video} muted playsInline data-testid={`${dataTestId}-video`} />
        {status === 'scanning' ? <div className={classes.frame} aria-hidden /> : null}
        {status === 'requesting' ? (
          <div className={classes.overlay} role='status'>
            <Typography variant='body2' color='inherit'>
              {SCANNER_COPY.requesting}
            </Typography>
          </div>
        ) : null}
        {blocked ? (
          <div className={classes.overlay} role='status'>
            <Typography variant='body2' color='inherit' data-testid={`${dataTestId}-message`}>
              {status === 'denied' ? SCANNER_COPY.denied : SCANNER_COPY.unavailable}
            </Typography>
            <TextLink type='button' onClick={onUsePasteLink} data-testid={`${dataTestId}-paste-link`}>
              <Typography variant='body1' component='span' color='inherit'>
                {SCANNER_COPY.pasteLink}
              </Typography>
            </TextLink>
          </div>
        ) : null}
      </Viewfinder>
      {invalid ? (
        <ErrorText variant='body2' role='alert' data-testid={`${dataTestId}-error`}>
          {InviteLinkErrors.InvalidCode}
        </ErrorText>
      ) : null}
    </OnboardingBody>
  )
}

export default QrScannerComponent
