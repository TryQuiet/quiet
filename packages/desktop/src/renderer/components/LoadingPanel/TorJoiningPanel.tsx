import React from 'react'
import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import Modal from '../ui/Modal/Modal'
import ActionProgress from '../ui/ActionProgress/ActionProgress'
import GlobeImg from '../../static/images/onboarding/joining-globe-2x.png'
import { Site } from '@quiet/common'
import { ConnectionProcessInfo } from '@quiet/types'

/**
 * Joining or creating a community reached over Tor alone, from the Quiet Design
 * Library's `Joining now` (0j7Nna9zWmfOSNmRmQK1Uh 5978:19161) and the same
 * screen inside the community chrome (y8h6w8PYR9jyI3zjYHL9Cl 1316:34596):
 * the globe at 126x120, the title at 18/27 w500, the bar with `Connecting via
 * Tor` as its status (`I1367:34496;3816:12490`), then the explanation and the
 * link.
 *
 * The title renders at the type scale's `title` (20/28 w500, MUI `h4`), which
 * is where the 4px grid put the design's 18/27; the emphasised run of the
 * paragraph renders at 500, the heaviest weight the app bundles, where the
 * frame draws 700.
 *
 * Desktop puts this content in the `Modal full-window` shell, as every
 * onboarding screen does.
 */

const PREFIX = 'TorJoiningPanel'

const classes = {
  root: `${PREFIX}root`,
  contentWrapper: `${PREFIX}contentWrapper`,
  image: `${PREFIX}image`,
  animatedImage: `${PREFIX}animatedImage`,
  title: `${PREFIX}title`,
  progress: `${PREFIX}progress`,
  text: `${PREFIX}text`,
  emphasis: `${PREFIX}emphasis`,
  link: `${PREFIX}link`,
}

/** Globe animation scale (6110:27595), drawn at 126x120. */
const GLOBE_WIDTH = 126
const GLOBE_HEIGHT = 120

/**
 * The explanation, from `Joining now` (5978:19167). Kept as strings so the copy
 * is one piece of text rather than JSX fragments.
 *
 * Every line is the designer's except the first. The frame opens `You can exit
 * the app - we'll notify you once you're connected!`, which is a mobile frame's
 * claim: closing the window on desktop quits the app and stops the join, and
 * nothing notifies you afterwards. The first sentence is therefore the truthful
 * equivalent in the same register (decided 2026-09-13); the bold timing
 * sentence and everything after it are drawn as designed.
 */
export const TOR_EXPLANATION_LEAD = 'Keep Quiet open while you connect.\u00a0 '
export const TOR_EXPLANATION_EMPHASIS = 'This first time might take 30 seconds, 10 minutes, or even longer.'
export const TOR_EXPLANATION_REST_BEFORE_YOUR = " \n\nThere's a good reason why it's slow: Quiet stores data on "
export const TOR_EXPLANATION_REST_AFTER_YOUR =
  ' community’s devices (not Big Tech’s servers!) and uses the battle-tested privacy tool Tor to protect your information. Tor is fast once connected, but can take a long time to connect at first.'
export const TOR_LEARN_MORE = 'Learn more about Tor and Quiet'

/** The status under the bar, from `Joining` (1316:34596). */
export const TOR_STATUS = 'Connecting via Tor'

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`&.${classes.root}`]: {
    textAlign: 'center',
    width: '100%',
  },
  [`& .${classes.contentWrapper}`]: {
    // Frame 1211 (5978:19164) is 311 wide inside a 32px-padded 375 frame.
    maxWidth: 311,
    gap: theme.spacing(4),
  },
  '@keyframes rotate': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  [`& .${classes.image}`]: {
    width: GLOBE_WIDTH,
    height: GLOBE_HEIGHT,
  },
  [`& .${classes.animatedImage}`]: {
    width: GLOBE_WIDTH,
    height: GLOBE_HEIGHT,
    animationName: 'rotate',
    animationDuration: '8s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  [`& .${classes.title}`]: {
    color: theme.palette.colors.trueBlack,
  },
  [`& .${classes.text}`]: {
    color: theme.palette.colors.gray70,
    whiteSpace: 'pre-line',
  },
  [`& .${classes.emphasis}`]: {
    fontWeight: 500,
  },
  [`& .${classes.link}`]: {
    color: theme.palette.colors.linkBlue,
    cursor: 'pointer',
  },
}))

export interface TorJoiningPanelProps {
  open: boolean
  handleClose: () => void
  openUrl: (url: string) => void
  connectionInfo: { number: number; text: ConnectionProcessInfo }
  isOwner: boolean
}

export const TorJoiningPanel: React.FC<TorJoiningPanelProps> = ({
  open,
  handleClose,
  openUrl,
  connectionInfo,
  isOwner,
}) => (
  <Modal open={open} handleClose={handleClose} isCloseDisabled={true} withoutHeader>
    <StyledGrid
      container
      justifyContent='center'
      alignItems='center'
      className={classes.root}
      data-testid='torJoiningPanel'
    >
      <Grid
        container
        alignItems='center'
        direction='column'
        className={classes.contentWrapper}
        data-testid='joiningPanelComponent'
      >
        <img className={isOwner ? classes.image : classes.animatedImage} src={GlobeImg} alt='' aria-hidden />
        <Typography variant='h4' className={classes.title}>
          {isOwner ? 'Creating your community!' : 'Joining now!'}
        </Typography>
        <ActionProgress
          status={TOR_STATUS}
          secondary={connectionInfo.text}
          value={connectionInfo.number / 100}
          data-testid={'torJoiningProgress'}
        />
        {!isOwner && (
          <>
            <Typography variant='body2' className={classes.text} data-testid={'torExplanation'}>
              {TOR_EXPLANATION_LEAD}
              <span className={classes.emphasis}>{TOR_EXPLANATION_EMPHASIS}</span>
              {TOR_EXPLANATION_REST_BEFORE_YOUR}
              <i>your</i>
              {TOR_EXPLANATION_REST_AFTER_YOUR}
            </Typography>
            <a onClick={() => openUrl(Site.MAIN_PAGE)} data-testid={'torLearnMore'}>
              <Typography className={classes.link} variant='body2'>
                {TOR_LEARN_MORE}
              </Typography>
            </a>
          </>
        )}
      </Grid>
    </StyledGrid>
  </Modal>
)

export default TorJoiningPanel
