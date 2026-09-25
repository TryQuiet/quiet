import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CopyToClipboard from 'react-copy-to-clipboard'
import QR from 'react-qr-code'

import { ActionProgress } from '../ui/ActionProgress/ActionProgress'
import { ConfirmationToast } from '../ui/ConfirmationToast/ConfirmationToast'
import { LoadingButton } from '../ui/LoadingButton/LoadingButton'
import { tokens } from '../../design-system/tokens'
import { OnboardingBody } from './OnboardingBody'
import { ONBOARDING_BAR_ZONE_HEIGHT, ONBOARDING_STAGE_INSET } from './onboardingRhythm'

const PREFIX = 'DisplayQrCodeComponent'

const classes = {
  box: `${PREFIX}box`,
  boxText: `${PREFIX}boxText`,
  copy: `${PREFIX}copy`,
  button: `${PREFIX}button`,
}

/** The library's qr-code-box (5996:24052): 220 square, 1px #B3B3B3, r4, the 188 code inset 16. */
export const QR_BOX_SIZE = 220
export const QR_SIZE = 188
const QR_BOX_INSET = (QR_BOX_SIZE - QR_SIZE) / 2
/** The Add members QR sheet's primary button (2932:3707), which Copy link is drawn as. */
const COPY_BUTTON_HEIGHT = 50

/**
 * The floor for the room the sheet gives the box: the copy under the code is what must stay on
 * screen (#3690), so on the shortest windows the code gives way first.
 */
export const QR_BOX_MIN_SIZE = 128

/**
 * Everything on the sheet but the box, top to bottom: the bar zone, the stage inset, the three
 * gaps, the two-line sentence, the four-line security copy (both at the 343 column every
 * window gets), Copy link and the column's bottom padding.
 */
export const QR_SHEET_CHROME_HEIGHT =
  ONBOARDING_BAR_ZONE_HEIGHT +
  ONBOARDING_STAGE_INSET +
  3 * tokens.semantic.lg +
  2 * tokens.type.body.lineHeight +
  4 * tokens.type.caption.lineHeight +
  COPY_BUTTON_HEIGHT +
  tokens.semantic.xxl

/**
 * The window height under which the sheet no longer fits with a 220 box. Below it the sheet
 * closes its gaps up to 8 and gives back most of the column's bottom padding, and the box takes
 * the room that frees, which keeps the sheet on screen down to the 400 minimum window. Anything
 * that still does not fit scrolls in the Modal.
 */
export const QR_SHEET_COMPACT_BELOW = QR_SHEET_CHROME_HEIGHT + QR_BOX_SIZE
const QR_SHEET_COMPACT_CHROME_HEIGHT =
  QR_SHEET_CHROME_HEIGHT - 3 * (tokens.semantic.lg - tokens.semantic.sm) - (tokens.semantic.xxl - tokens.semantic.sm)

/**
 * A code drawn at a fractional number of device pixels per module aliases, and below about
 * 2.5 a scanner can stop reading it: at 1x, jsQR reads a 69-module device link off the screen at
 * a 188 box but not at 144, 164 or 184. Under this the code is snapped to a whole number of
 * device pixels per module, which reads at every size.
 */
const SMOOTH_MIN_DEVICE_PX_PER_MODULE = 2.5
const SNAPPED_MIN_DEVICE_PX_PER_MODULE = 2

export interface QrFit {
  /** The box's side, CSS px. */
  box: number
  /** The code's side inside it, CSS px. */
  code: number
  /** Snapped to whole device pixels per module, so the edges are drawn crisp. */
  crisp: boolean
}

/**
 * The box follows the window's height (#3690): the design's 220 wherever the whole sheet fits,
 * smaller on a shorter window so the copy and Copy link stay on screen. A shrunk code keeps at
 * least SMOOTH_MIN_DEVICE_PX_PER_MODULE, or is snapped to whole device pixels per module: down
 * when the room allows two or more, up to two when it does not. A code that cannot be scanned is
 * no use, so on the shortest windows at 1x the box can take more than its room (170 on a 400
 * window) — the copy stays on screen and Copy link is reached by scrolling.
 * `modules` is the code's side in modules; unknown, the box simply fills its room.
 */
export const fitQrBox = (windowHeight: number, devicePixelRatio: number, modules?: number): QrFit => {
  const chrome = windowHeight < QR_SHEET_COMPACT_BELOW ? QR_SHEET_COMPACT_CHROME_HEIGHT : QR_SHEET_CHROME_HEIGHT
  const box = Math.min(QR_BOX_SIZE, Math.max(QR_BOX_MIN_SIZE, windowHeight - chrome))
  const code = box - 2 * QR_BOX_INSET
  const devicePxPerModule = modules ? (code * devicePixelRatio) / modules : Infinity
  if (box === QR_BOX_SIZE || devicePxPerModule >= SMOOTH_MIN_DEVICE_PX_PER_MODULE) {
    return { box, code, crisp: false }
  }
  const snapped =
    (Math.max(SNAPPED_MIN_DEVICE_PX_PER_MODULE, Math.floor(devicePxPerModule)) * (modules as number)) / devicePixelRatio
  return { box: snapped + 2 * QR_BOX_INSET, code: snapped, crisp: true }
}

const readWindow = () => ({ height: window.innerHeight, devicePixelRatio: window.devicePixelRatio || 1 })

/**
 * The window's height and pixel ratio, kept current. A ratio change (the window moved to a screen
 * at another scale) need not resize the window, so it is watched on its own.
 */
const useWindowFit = () => {
  const [size, setSize] = useState(readWindow)
  useEffect(() => {
    const update = () => setSize(readWindow())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  useEffect(() => {
    const ratio = window.matchMedia?.(`(resolution: ${size.devicePixelRatio}dppx)`)
    if (!ratio?.addEventListener) return
    const update = () => setSize(readWindow())
    ratio.addEventListener('change', update)
    return () => ratio.removeEventListener('change', update)
  }, [size.devicePixelRatio])
  return size
}

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.space.lg,
  [`@media (max-height: ${QR_SHEET_COMPACT_BELOW - 1}px)`]: {
    gap: theme.space.sm,
    // OnboardingBody's bottom padding is the column's, not this element's; the negative margin
    // leaves `sm` of it under Copy link rather than scrolling the rest into view.
    marginBottom: theme.space.sm - theme.space.xxl,
  },
  [`& .${classes.box}`]: {
    boxSizing: 'border-box',
    flexShrink: 0,
    width: QR_BOX_SIZE,
    height: QR_BOX_SIZE,
    padding: QR_BOX_INSET - 1,
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
    height: COPY_BUTTON_HEIGHT,
    padding: `${theme.space.md}px 20px`,
    borderRadius: 16,
    backgroundColor: theme.palette.colors.quietBlue,
    color: theme.palette.colors.white,
    textTransform: 'none',
    fontSize: 16,
    fontWeight: 400,
  },
}))

/** Sheet copy (2811:2601), verbatim. */
export const DISPLAY_QR_CODE_COPY = {
  scan: 'Scan this from “Link devices” on another device to link the devices.',
  copyLink: 'Copy link',
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
  dataTestId?: string
}

/**
 * Link devices — QR code (2811:2601; desktop 880:17427): the QR in the designed box, the
 * sheet's sentence, then — the user's decision (2026-09-13), in the slot the Add members
 * QR sheet gives its primary button — Copy link. The frame's Reset QR code link is not
 * drawn (user decision, #3690). The raw link is never shown; Copy link puts it on the
 * clipboard and confirms briefly.
 * While the link is minted the actions give way to the library's progress bar with the
 * status line (ActionProgress, #3518's rule: never a greyed-out button); without a
 * community there is nothing to act on, so the box says so and no action is drawn.
 */
export const DisplayQrCodeComponent: React.FC<DisplayQrCodeComponentProps> = ({
  deviceLink,
  isLoading,
  dataTestId = 'display-qr-code',
}) => {
  const [copied, setCopied] = useState(false)
  const ready = Boolean(deviceLink)
  const boxRef = useRef<HTMLDivElement>(null)
  // The code's side in modules is its viewBox; react-qr-code says it nowhere else.
  const [modules, setModules] = useState<number>()
  useLayoutEffect(() => {
    const viewBox = boxRef.current?.querySelector('svg')?.getAttribute('viewBox')
    setModules(viewBox ? Number(viewBox.split(' ')[2]) : undefined)
  }, [deviceLink])
  const viewport = useWindowFit()
  const fit = fitQrBox(viewport.height, viewport.devicePixelRatio, modules)
  return (
    <OnboardingBody dataTestId={dataTestId}>
      <Root>
        <div
          ref={boxRef}
          className={classes.box}
          style={{ width: fit.box, height: fit.box }}
          data-testid={`${dataTestId}-box`}
        >
          {ready ? (
            <QR
              value={deviceLink}
              size={fit.code}
              shapeRendering={fit.crisp ? 'crispEdges' : undefined}
              data-testid={`${dataTestId}-qr`}
            />
          ) : null}
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
