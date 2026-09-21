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
  destructive: `${PREFIX}destructive`,
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

  [`& .${classes.destructive}`]: {
    color: theme.palette.error.main,
  },

  // The design pairs an optional value with the chevron at a gap of 8 ("Off", "3" at 16/26
  // #7F7F7F), so the slot is a row of its own.
  [`& .${classes.control}`]: {
    gap: 8,
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
  /**
   * Id of the control this row labels. The row then renders as a <label>, so pressing anywhere on
   * it activates that control and a screen reader announces the row's text as the control's name.
   * Native label activation fires once, including when the control itself is pressed, so the row
   * and the control cannot toggle each other back.
   */
  htmlFor?: string
  /** Omit the rule beneath, for the last row in a group. */
  divider?: boolean
  /** A destructive action — Leave community, Delete channel — which the design draws in red. */
  destructive?: boolean
  testIdPrefix?: string
  /** Verbatim id for the row element, where a caller already has one that others depend on. */
  testId?: string
}

export const PanelRow: React.FC<PanelRowProps> = ({
  title,
  subtitle,
  icon,
  control,
  onClick,
  htmlFor,
  divider = true,
  destructive = false,
  testIdPrefix,
  testId,
}) => {
  const contentProps = {
    className: classNames(classes.content, { [classes.interactive]: Boolean(onClick) || Boolean(htmlFor) }),
    onClick,
    'data-testid': testId ?? (testIdPrefix ? `${testIdPrefix}-row` : undefined),
  }

  const content = (
    <>
      {icon && <span className={classes.icon}>{icon}</span>}
      <span className={classes.text}>
        <Typography
          className={classNames(classes.title, { [classes.destructive]: destructive })}
          data-testid={testIdPrefix ? `${testIdPrefix}-title` : undefined}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography className={classes.subtitle} data-testid={testIdPrefix ? `${testIdPrefix}-subtitle` : undefined}>
            {subtitle}
          </Typography>
        )}
      </span>
      {control && <span className={classes.control}>{control}</span>}
    </>
  )

  return (
    <StyledRow>
      {htmlFor ? (
        <label htmlFor={htmlFor} {...contentProps}>
          {content}
        </label>
      ) : (
        <div {...contentProps}>{content}</div>
      )}
      {divider && <PanelDivider />}
    </StyledRow>
  )
}

/**
 * The design's "Divider-quiet": a 1px #F0F0F0 rule that stops at the row's own inset rather than
 * running the full width of the panel — 343 inside a 375 column (DM settings 816:28609).
 */
export const PanelDivider = styled('div')(({ theme }) => ({
  height: 1,
  marginLeft: PANEL_ROW_INSET,
  marginRight: PANEL_ROW_INSET,
  backgroundColor: theme.palette.colors.border01,
}))

export default PanelRow
