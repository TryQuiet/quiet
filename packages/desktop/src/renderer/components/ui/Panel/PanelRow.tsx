import React from 'react'

import { Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'

/**
 * A full-bleed row inside a side panel: an optional leading icon, a title with an optional
 * subtitle, an optional trailing control, and a rule beneath.
 *
 * This is the design library's "Button row" (Figma 0j7Nna9zWmfOSNmRmQK1Uh 2989:185) — 16 of
 * horizontal padding and 11 of vertical, a 16 gap, 48 tall without a subtitle and 64 with one,
 * going to #F0F0F0 on hover when the row is something you can press. Panels lay rows edge to edge,
 * so the row owns its own insets rather than inheriting a gutter from the panel.
 */
export const PANEL_ROW_HEIGHT = 48
export const PANEL_ROW_HEIGHT_WITH_SUBTITLE = 64
export const PANEL_ROW_INSET = 16

const PREFIX = 'PanelRow'

const classes = {
  root: `${PREFIX}root`,
  content: `${PREFIX}content`,
  interactive: `${PREFIX}interactive`,
  icon: `${PREFIX}icon`,
  text: `${PREFIX}text`,
  title: `${PREFIX}title`,
  subtitle: `${PREFIX}subtitle`,
  control: `${PREFIX}control`,
}

const StyledRow = styled('div')(({ theme }) => ({
  [`& .${classes.content}`]: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: PANEL_ROW_HEIGHT,
    padding: `11px ${PANEL_ROW_INSET}px`,
    backgroundColor: theme.palette.background.default,
  },

  [`& .${classes.interactive}`]: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.colors.border01,
    },
  },

  [`& .${classes.icon}`]: {
    display: 'flex',
    flex: '0 0 24px',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  [`& .${classes.text}`]: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minWidth: 0,
  },

  [`& .${classes.title}`]: {
    fontSize: 16,
    lineHeight: '26px',
  },

  [`& .${classes.subtitle}`]: {
    fontSize: 12,
    lineHeight: '16px',
    letterSpacing: '0.4px',
    color: theme.palette.colors.gray50,
  },

  [`& .${classes.control}`]: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
  },
}))

export interface PanelRowProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  control?: React.ReactNode
  onClick?: () => void
  /** Omit the rule beneath, for the last row in a group. */
  divider?: boolean
  testIdPrefix?: string
}

export const PanelRow: React.FC<PanelRowProps> = ({
  title,
  subtitle,
  icon,
  control,
  onClick,
  divider = true,
  testIdPrefix,
}) => {
  return (
    <StyledRow>
      <div
        className={classNames(classes.content, { [classes.interactive]: Boolean(onClick) })}
        onClick={onClick}
        data-testid={testIdPrefix ? `${testIdPrefix}-row` : undefined}
      >
        {icon && <span className={classes.icon}>{icon}</span>}
        <span className={classes.text}>
          <Typography className={classes.title} data-testid={testIdPrefix ? `${testIdPrefix}-title` : undefined}>
            {title}
          </Typography>
          {subtitle && (
            <Typography
              className={classes.subtitle}
              data-testid={testIdPrefix ? `${testIdPrefix}-subtitle` : undefined}
            >
              {subtitle}
            </Typography>
          )}
        </span>
        {control && <span className={classes.control}>{control}</span>}
      </div>
      {divider && <PanelDivider />}
    </StyledRow>
  )
}

/** The 1px #F0F0F0 rule the design puts under a row and under the header. */
export const PanelDivider = styled('div')(({ theme }) => ({
  height: 1,
  backgroundColor: theme.palette.colors.border01,
}))

export default PanelRow
