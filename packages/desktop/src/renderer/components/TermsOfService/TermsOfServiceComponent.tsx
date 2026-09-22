import React from 'react'
import { styled } from '@mui/material/styles'

import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'

import { AgreeAndJoinCard } from '../Onboarding/AgreeAndJoinCard'

export { CARD_WIDTH, CARD_HEIGHT, WIDE_CARD_FROM } from '../Onboarding/AgreeAndJoinCard'

const PREFIX = 'TermOfServiceComponent-'
const classes = {
  info: `${PREFIX}info`,
  link: `${PREFIX}link`,
}

const Body = styled(Typography)({
  [`&.${classes.info}`]: {
    textAlign: 'left',
  },
  [`& .${classes.link}`]: {
    font: 'inherit',
    color: 'inherit',
    verticalAlign: 'baseline',
  },
}) as typeof Typography

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
 * prototype 2811:2724 / 3054:4090 (copy); the card itself is the library's
 * modal/small — see AgreeAndJoinCard, which the device-link consent step shares.
 * The prototype's copy is used; the library card's older wording adds
 * "(Note: server connection is not via Tor!)".
 */
export const TermsOfServiceComponent: React.FC<TermsOfServiceComponentProps> = ({
  open,
  handleClose,
  onAgree,
  openURL,
  qssEndPoint,
}) => (
  <AgreeAndJoinCard
    open={open}
    handleClose={handleClose}
    onAgree={onAgree}
    testIdPrefix='TermOfService'
    agreeTestId='TermOfService-UseQuietServer'
  >
    <Body variant='body2' className={classes.info}>
      This community uses a server {qssEndPoint ? `(${qssEndPoint}) ` : ''}for messaging without Tor. By joining you
      agree to this{' '}
      <Link component='button' type='button' underline='always' className={classes.link} onClick={openURL}>
        Privacy Policy and Terms of Use
      </Link>
      .
    </Body>
  </AgreeAndJoinCard>
)

export default TermsOfServiceComponent
