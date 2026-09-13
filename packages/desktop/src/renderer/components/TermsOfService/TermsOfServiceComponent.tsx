import React from 'react'
import { styled } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import Button from '@mui/material/Button'

import Modal from '../ui/Modal/Modal'

const PREFIX = 'TermOfServiceComponent-'
const classes = {
  column: `${PREFIX}column`,
  info: `${PREFIX}info`,
  link: `${PREFIX}link`,
  agreeButton: `${PREFIX}agreeButton`,
}

/** The library's modal/small is a responsive pair: 800 wide (6209:16742) or 1064 wide (6209:17520), 636 tall. */
export const CARD_WIDTH = { narrow: 800, wide: 1064 } as const
export const CARD_HEIGHT = 636
/** The wide card from the click-through's 1280 desktop size on; the 1024 window gets the 800 card. */
export const WIDE_CARD_FROM = 1280
const TITLE_BAR_HEIGHT = 60
/** The card's content column, centered: 468 wide (166 in at 800, 298 in at 1064 on the exports). */
const COLUMN_WIDTH = 468

const Root = styled('div')(({ theme }) => ({
  width: '100%',
  // The library card is 636 tall (bar included). The Modal centres the card, so a window
  // shorter than that pushed the titled bar above the viewport (only its hairline showed):
  // cap the card at the window instead — the bar and the content stay in view.
  height: `min(${CARD_HEIGHT - TITLE_BAR_HEIGHT}px, calc(100vh - ${TITLE_BAR_HEIGHT}px))`,
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.default,

  [`& .${classes.column}`]: {
    width: COLUMN_WIDTH,
    maxWidth: '100%',
    boxSizing: 'border-box',
    paddingTop: theme.space.xxl,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.space.lg,
  },

  [`& .${classes.info}`]: {
    textAlign: 'left',
  },

  [`& .${classes.link}`]: {
    font: 'inherit',
    color: 'inherit',
    verticalAlign: 'baseline',
  },

  // The library's Button, Large: 50 tall, 12/20 padding; radius 16 and the 16/400 label from the theme.
  [`& .${classes.agreeButton}`]: {
    height: 50,
    padding: `${theme.space.md}px ${theme.space.xl - theme.space.xs}px`,
  },
}))

export interface TermsOfServiceComponentProps {
  open: boolean
  /** Back arrow, backdrop and Escape: the user did not agree. */
  handleClose: () => void
  onAgree: () => void
  openURL: () => void
  /** The host the copy names, e.g. api.tryquiet.org. */
  qssEndPoint?: string
}

/**
 * Agree & join · the joiner's consent to the community's server. Mobile
 * prototype 2811:2724 / 3054:4090 (copy); on desktop the library's modal/small
 * card with its titled bar ("Agree & join", back arrow, hairline), the body
 * column left-aligned, one button. The prototype's copy is used; the library
 * card's older wording adds "(Note: server connection is not via Tor!)".
 */
export const TermsOfServiceComponent: React.FC<TermsOfServiceComponentProps> = ({
  open,
  handleClose,
  onAgree,
  openURL,
  qssEndPoint,
}) => {
  const wide = useMediaQuery(`(min-width:${WIDE_CARD_FROM}px)`)
  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title='Agree & join'
      canGoBack
      handleBack={handleClose}
      alignCloseLeft
      addBorder
      fullPage={false}
      contentWidth={wide ? CARD_WIDTH.wide : CARD_WIDTH.narrow}
      cornerRadius={8}
      testIdPrefix='TermOfService'
    >
      <Root data-testid='agree-and-join'>
        <div className={classes.column}>
          <Typography variant='body2' className={classes.info}>
            This community uses a server {qssEndPoint ? `(${qssEndPoint}) ` : ''}for messaging without Tor. By joining
            you agree to this{' '}
            <Link component='button' type='button' underline='always' className={classes.link} onClick={openURL}>
              Privacy Policy and Terms of Use
            </Link>
            .
          </Typography>
          <Button
            variant='contained'
            color='primary'
            size='large'
            className={classes.agreeButton}
            onClick={onAgree}
            data-testid='TermOfService-UseQuietServer'
          >
            Agree & Join
          </Button>
        </div>
      </Root>
    </Modal>
  )
}

export default TermsOfServiceComponent
