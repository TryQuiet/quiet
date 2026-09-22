import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import WarningIcon from '@mui/icons-material/Warning'
import classNames from 'classnames'

import { tokens } from '../../design-system/tokens'

const PREFIX = 'OnboardingBody'

const classes = {
  heading: `${PREFIX}heading`,
  intro: `${PREFIX}intro`,
  leading: `${PREFIX}leading`,
  section: `${PREFIX}section`,
  bordered: `${PREFIX}bordered`,
  betaWarning: `${PREFIX}betaWarning`,
  betaIcon: `${PREFIX}betaIcon`,
  flushLeading: `${PREFIX}flushLeading`,
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
  padding: `${theme.space.xl}px ${theme.space.lg}px ${theme.space.xxl}px`,
  // A screen whose illustration sits directly under the bar (Join community, 2811:2562: graphic at y 60).
  [`&.${classes.flushLeading}`]: {
    paddingTop: 0,
  },
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: theme.space.xl,
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
  /** The leading illustration starts at the top of the column, no padding above it (as the frame draws it). */
  flushLeading?: boolean
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
 * caption ink in general but not what these frames use. The colour has to sit on this
 * element's own class: MUI writes the variant's colour onto the element, so neither an
 * inherited colour nor a rule on the row above it reaches the text. `gray90` is that ink,
 * inverted in the dark theme, which is how the library's Dark mode file draws text this size.
 */
const BetaCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.colors.gray90,
}))

export const OnboardingBody: React.FC<OnboardingBodyProps> = ({
  heading,
  intro,
  leading,
  flushLeading,
  betaWarning,
  dataTestId,
  children,
}) => (
  <Root data-testid={dataTestId} className={flushLeading ? classes.flushLeading : undefined}>
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
