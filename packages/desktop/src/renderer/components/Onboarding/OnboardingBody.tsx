import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import WarningIcon from '@mui/icons-material/Warning'
import classNames from 'classnames'

import { tokens } from '../../design-system/tokens'
import { ONBOARDING_BLOCK_GAP, ONBOARDING_STAGE_INSET } from './onboardingRhythm'

const PREFIX = 'OnboardingBody'

const classes = {
  heading: `${PREFIX}heading`,
  intro: `${PREFIX}intro`,
  leading: `${PREFIX}leading`,
  section: `${PREFIX}section`,
  bordered: `${PREFIX}bordered`,
  betaWarning: `${PREFIX}betaWarning`,
  betaIcon: `${PREFIX}betaIcon`,
}

/**
 * The 600px modal body every onboarding screen lives in on desktop. The
 * prototype is 375 wide; the same tokens set the rhythm here.
 */
/** The prototype's frame width: desktop hosts the same column inside Modal full-window. */
export const CONTENT_COLUMN_WIDTH = 375

const Root = styled('div')(({ theme }) => ({
  width: '100%',
  maxWidth: CONTENT_COLUMN_WIDTH,
  margin: '0 auto',
  boxSizing: 'border-box',
  // One vertical rhythm for every full-screen stage: the first content element
  // sits ONBOARDING_STAGE_INSET below the bar zone, and the blocks under it are
  // ONBOARDING_BLOCK_GAP apart. No screen overrides either — that is what makes
  // moving between stages land the block in the same place every time.
  padding: `${ONBOARDING_STAGE_INSET}px ${theme.space.lg}px ${theme.space.xxl}px`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: ONBOARDING_BLOCK_GAP,
  backgroundColor: theme.palette.background.default,
  [`& .${classes.heading}`]: {
    margin: 0,
    textAlign: 'center',
  },
  [`& .${classes.intro}`]: {
    marginTop: theme.space.sm,
    textAlign: 'center',
  },
  [`& .${classes.leading}`]: {
    display: 'flex',
    justifyContent: 'center',
  },
  [`& .${classes.section}`]: {
    display: 'flex',
    flexDirection: 'column',
  },
  // The library's bordered "Buttons" group (2811:2575, 879:20987): 1px #E5E5E5, r16, rows padded 16 inside;
  // the last row's hairline coincides with the group's stroke in the frame, so it is dropped here.
  [`& .${classes.bordered}`]: {
    border: `1px solid ${theme.palette.colors.border04}`,
    borderRadius: tokens.radii[3],
    overflow: 'hidden',
    '& > .MuiListItemButton-root': {
      paddingLeft: theme.space.lg,
      paddingRight: theme.space.lg,
    },
    '& > .MuiListItemButton-root:last-child': {
      borderBottom: 'none',
    },
  },
  [`& .${classes.betaWarning}`]: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: theme.space.xs,
  },
  [`& .${classes.betaIcon}`]: {
    width: 16,
    height: 16,
    color: theme.palette.warning.main,
  },
}))

export interface OnboardingBodyProps {
  /** Screen heading (h3 on the 4px scale). */
  heading?: React.ReactNode
  /** Paragraph under the heading (body). */
  intro?: React.ReactNode
  /** Rendered above the heading (illustrations). */
  leading?: React.ReactNode
  betaWarning?: boolean
  dataTestId?: string
  children?: React.ReactNode
}

export const BETA_WARNING = "Quiet is in beta and shouldn't be used for activities requiring security."

/**
 * The beta line, in the ink the frames draw it in: `Status`, Rubik 12/16 w400 #222222, on
 * Get started (`0j7Nna9zWmfOSNmRmQK1Uh` `6066:27523`) and on Join community (`6072:19844`).
 * Every beta-warning caption in the Figma cache - 21 nodes across four files - is #222222;
 * none is grey. `variant='caption'` alone paints it gray40 (#999999), which is the library's
 * caption ink in general but not what these frames use. MUI writes the variant's colour onto
 * the element itself, so a colour inherited from the row never reaches the text - which is
 * what the row's old `darkGray` was doing, reaching only the gap beside the glyph. A class on
 * the row would win in a browser, on specificity, but jsdom resolves `getComputedStyle` by
 * document order, so it would report the grey and no test could tell. Declaring the colour on
 * this element's own class is the one placement both agree on. `gray90` is that ink, inverted
 * in the dark theme, which is how the library's Dark mode file draws text this size.
 */
const BetaCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.colors.gray90,
}))

export const OnboardingBody: React.FC<OnboardingBodyProps> = ({
  heading,
  intro,
  leading,
  betaWarning,
  dataTestId,
  children,
}) => (
  // `data-onboarding-body` marks the column for onboardingRhythm.test.tsx, which sweeps
  // every Screens/Onboarding story and fails if any stage's column does not carry the
  // class's inset and gap. A new screen is covered the moment it renders this.
  <Root data-testid={dataTestId} data-onboarding-body=''>
    {leading ? <div className={classes.leading}>{leading}</div> : null}
    {heading || intro ? (
      <div>
        {heading ? (
          <Typography variant='h3' className={classes.heading}>
            {heading}
          </Typography>
        ) : null}
        {intro ? (
          <Typography variant='body2' className={classes.intro} component='div'>
            {intro}
          </Typography>
        ) : null}
      </div>
    ) : null}
    {children}
    {betaWarning ? (
      <div className={classes.betaWarning} data-testid='onboardingBetaWarning'>
        <WarningIcon className={classes.betaIcon} />
        <BetaCaption variant='caption' data-testid='onboardingBetaWarningText'>
          {BETA_WARNING}
        </BetaCaption>
      </div>
    ) : null}
  </Root>
)

/**
 * A stack of ActionRows. `bordered` is the library's bordered group (1px #E5E5E5, r16) the
 * frames draw around the rows; Link devices uses it, the other screens still draw bare rows
 * (a cross-cutting parity item, see ONBOARDING.md · Mobile parity audit).
 */
export const RowGroup: React.FC<{ children: React.ReactNode; bordered?: boolean; dataTestId?: string }> = ({
  children,
  bordered = false,
  dataTestId,
}) => (
  <div className={classNames(classes.section, { [classes.bordered]: bordered })} data-testid={dataTestId}>
    {children}
  </div>
)

export default OnboardingBody
