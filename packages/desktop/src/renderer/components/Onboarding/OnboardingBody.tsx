import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import WarningIcon from '@mui/icons-material/Warning'

const PREFIX = 'OnboardingBody'

const classes = {
  heading: `${PREFIX}heading`,
  intro: `${PREFIX}intro`,
  leading: `${PREFIX}leading`,
  section: `${PREFIX}section`,
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
  padding: `${theme.space.xl}px ${theme.space.lg}px ${theme.space.xxl}px`,
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
  [`& .${classes.betaWarning}`]: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: theme.space.xs,
    color: theme.palette.colors.darkGray,
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

export const OnboardingBody: React.FC<OnboardingBodyProps> = ({
  heading,
  intro,
  leading,
  betaWarning,
  dataTestId,
  children,
}) => (
  <Root data-testid={dataTestId}>
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
        <Typography variant='caption'>{BETA_WARNING}</Typography>
      </div>
    ) : null}
  </Root>
)

/** A stack of ActionRows. */
export const RowGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className={classes.section}>{children}</div>
)

export default OnboardingBody
