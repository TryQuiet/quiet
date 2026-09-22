import React, { useCallback, useState } from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import type { InvitationData } from '@quiet/types'

import { openCameraPrivacySettings } from '../../../camera'
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
  /** Which OS setting the denied state names; the running one, except in stories and tests. */
  platform?: NodeJS.Platform
  dataTestId?: string
}

/**
 * Not in the prototype: the sheets show only the camera. The permission-pending,
 * denied and no-camera states below are the minimum needed to say what happened and
 * offer the paste field instead; their copy is not the designer's.
 */
export const SCANNER_COPY = {
  requesting: 'Requesting camera access…',
  /**
   * Linux has no camera permission to grant, so a refusal there came from the browser
   * stack and names no setting. On the two platforms that do store the refusal, saying
   * only that it happened is a dead end: macOS shows its dialog once and Windows shows
   * none at all, so the copy names the page the toggle is on and `openSettings` opens it.
   */
  denied: 'Camera access was denied.',
  deniedDarwin: 'Allow Quiet to use the camera in System Settings → Privacy & Security → Camera.',
  deniedWin32: 'Allow Quiet to use the camera in Windows Settings → Privacy & security → Camera.',
  openSettings: 'Open settings',
  unavailable: 'No camera is available.',
  /** The Open invite link frame's own link text. */
  pasteLink: PASTE_A_LINK_LABEL,
} as const

/**
 * The copy for a refusal on `platform`, and whether that platform has a settings page to
 * offer. Mobile keeps its own copy of the map (mobile QrScannerSheet.component.tsx): it
 * asks Android and iOS for the camera through their own APIs and has no desktop IPC, so
 * the two maps are the same three lines and diverge from here on.
 */
export const deniedCopy = (platform: NodeJS.Platform): { message: string; canOpenSettings: boolean } => {
  if (platform === 'darwin') return { message: SCANNER_COPY.deniedDarwin, canOpenSettings: true }
  if (platform === 'win32') return { message: SCANNER_COPY.deniedWin32, canOpenSettings: true }
  return { message: SCANNER_COPY.denied, canOpenSettings: false }
}

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
  platform = process.platform,
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

  const { videoRef, status, retryWhenRefocused } = useQrScanner({ onCode })
  const blocked = BLOCKED.includes(status)
  const denied = deniedCopy(platform)

  /** Arm the retry on the click, not on the IPC's answer: the window may lose focus first. */
  const openSettings = useCallback(() => {
    retryWhenRefocused()
    void openCameraPrivacySettings()
  }, [retryWhenRefocused])

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
              {status === 'denied' ? denied.message : SCANNER_COPY.unavailable}
            </Typography>
            {status === 'denied' && denied.canOpenSettings ? (
              <TextLink type='button' onClick={openSettings} data-testid={`${dataTestId}-open-settings`}>
                <Typography variant='body1' component='span' color='inherit'>
                  {SCANNER_COPY.openSettings}
                </Typography>
              </TextLink>
            ) : null}
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
