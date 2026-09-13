import React from 'react'

import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

/**
 * An action in progress: the library's progress bar with a status line under
 * it, from the Quiet Design Library (0j7Nna9zWmfOSNmRmQK1Uh):
 *
 * - `Progress bar 2` / `With text=True` (5390:19570) — a 6px vertical stack of
 *   the bar, a status line (Rubik 14/20 #222222, centred) and an optional
 *   second line (Rubik 12/16 #7F7F7F, centred). `With text=False` (5390:19601)
 *   is the bar alone.
 * - `Progress bar base 2` (5390:18021) — a 300x4 track, radius 100, #F0F0F0,
 *   whose fill is 8px at `Filled=empty` (5390:18024), 150 at half and 300 at
 *   full. 8px is therefore the floor for a fill, not 0.
 * - `Progress-loading-template` (6049:26981) puts that stack in a 24px-padded
 *   panel; the `Joining now` frames (5978:19142, 5978:19161) put the same bar
 *   under the frame's own title, which is how a modal keeps its heading.
 *
 * The fill is teal #67BFD3 (`colors.lushSky`) — the fill of the progress bar
 * these frames were drawn from (y8h6w8PYR9jyI3zjYHL9Cl 3816:12486) and the
 * decision of record. The relaid-out library component fills #1B6FEC instead
 * (5390:18025); that value is deliberately not used.
 *
 * There is no loading variant of Button in the library — set 3505:10206 is
 * Default / Hover / Disabled — which is the point of this component. An action
 * in progress is a progress bar with a status line, never a greyed-out button
 * with the status inside it.
 */

const PREFIX = 'ActionProgress'

export const classes = {
  root: `${PREFIX}root`,
  track: `${PREFIX}track`,
  fill: `${PREFIX}fill`,
  status: `${PREFIX}status`,
  secondary: `${PREFIX}secondary`,
}

/** Progress bar base 2 (5390:18021): a 300x4 track, and a fill no shorter than 8. */
const TRACK_WIDTH = 300
const TRACK_HEIGHT = 4
const MIN_FILL = 8

/** JoiningPanelComponent's existing sweep, which this matches so the two bars read alike. */
const INDETERMINATE_DURATION_MS = 4000

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`&.${classes.root}`]: {
    // Progress bar 2 (5390:19570): a vertical stack, 6px between the rows.
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    width: TRACK_WIDTH,
    maxWidth: '100%',
  },

  [`& .${classes.track}`]: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: 100,
    backgroundColor: theme.palette.background.paper,
    overflow: 'hidden',
  },

  [`& .${classes.fill}`]: {
    height: TRACK_HEIGHT,
    minWidth: MIN_FILL,
    borderRadius: 100,
    backgroundColor: theme.palette.colors.lushSky,
  },

  // No phases to report: the fill sweeps the track instead of standing still.
  '@keyframes actionProgressSweep': {
    from: { width: MIN_FILL },
    to: { width: '100%' },
  },
  [`& .${classes.fill}[data-indeterminate='true']`]: {
    animationName: 'actionProgressSweep',
    animationDuration: `${INDETERMINATE_DURATION_MS}ms`,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },

  [`& .${classes.status}`]: {
    textAlign: 'center',
  },

  [`& .${classes.secondary}`]: {
    textAlign: 'center',
    color: theme.palette.colors.darkGray,
  },
}))

export interface ActionProgressProps {
  /** The status line, verbatim from the design where there is one: 'Joining now!', 'Leaving community…'. */
  status: string
  /** The optional second line under the status (Additional info, 5390:19573). */
  secondary?: string
  /**
   * How far along, 0 to 1, for an action that reports real phases. Omitted for
   * an action that does not, which sweeps the fill instead.
   */
  value?: number
  className?: string
  'data-testid'?: string
}

export const ActionProgress: React.FC<ActionProgressProps> = ({
  status,
  secondary,
  value,
  className,
  'data-testid': dataTestId = 'actionProgress',
}) => {
  const determinate = typeof value === 'number' && Number.isFinite(value)
  const percent = determinate ? Math.min(100, Math.max(0, value * 100)) : undefined

  return (
    <StyledGrid className={[classes.root, className].filter(Boolean).join(' ')} data-testid={dataTestId}>
      <div
        className={classes.track}
        role='progressbar'
        aria-valuemin={0}
        aria-valuemax={100}
        {...(percent !== undefined ? { 'aria-valuenow': Math.round(percent) } : {})}
      >
        <div
          className={classes.fill}
          data-indeterminate={determinate ? 'false' : 'true'}
          data-testid={'actionProgressFill'}
          style={determinate ? { width: `${percent}%` } : undefined}
        />
      </div>
      <Typography variant='body2' role='status' className={classes.status} data-testid={'actionProgressStatus'}>
        {status}
      </Typography>
      {secondary && (
        <Typography variant='caption' className={classes.secondary} data-testid={'actionProgressSecondary'}>
          {secondary}
        </Typography>
      )}
    </StyledGrid>
  )
}

export default ActionProgress
