import React from 'react'

import { Button, IconButton, Typography } from '@mui/material'
import classNames from 'classnames'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import { styled } from '@mui/material/styles'

/**
 * Geometry from the design library's "Title bar/Logged in" (Figma 0j7Nna9zWmfOSNmRmQK1Uh
 * 3606:13240), as instantiated by the create-channel panel: 60 tall, the leading glyph 28 square
 * at a 14 inset, the title centred on the full width at 16/26 weight 500, and a hairline rule
 * along the bottom. The bar is full bleed — the panel's content insets belong to the blocks
 * beneath it, not to the header.
 */
export const PANEL_HEADER_HEIGHT = 60
/** With a subtitle the bar is 64, as "Add members or roles" draws it (838:9306). */
export const PANEL_HEADER_HEIGHT_WITH_SUBTITLE = 64
export const PANEL_HEADER_GLYPH = 28
export const PANEL_HEADER_INSET = 14
/**
 * Minimum hit area for the bar's controls. The design draws a 28 glyph and a text-only action, but
 * drawing them at that size makes them that size to press — well under the 44 every touch guideline
 * asks for. The controls keep the design's look and gain the target through padding, pulled back by
 * an equal negative margin so nothing moves optically.
 */
const TOUCH_TARGET = 44

/** Content inset shared by the side panels. */
export const PANEL_INSET = 16

/** Width of a side panel's content column, matching the 375 the mobile screens use. */
export const PANEL_WIDTH = 375

/** The colour the designs give a title-bar action such as Done; not a desktop token yet. */
const PANEL_ACTION_COLOR = '#2373EA'

const PREFIX = 'PanelHeader'

const classes = {
  root: `${PREFIX}root`,
  withSubtitle: `${PREFIX}withSubtitle`,
  centre: `${PREFIX}centre`,
  glyph: `${PREFIX}glyph`,
  title: `${PREFIX}title`,
  subtitle: `${PREFIX}subtitle`,
  action: `${PREFIX}action`,
}

const StyledHeader = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: PANEL_HEADER_HEIGHT,
    flex: `0 0 ${PANEL_HEADER_HEIGHT}px`,
    paddingLeft: PANEL_HEADER_INSET,
    paddingRight: PANEL_HEADER_INSET,
    borderBottom: `1px solid ${theme.palette.colors.border01}`,
    backgroundColor: theme.palette.background.default,
  },

  [`& .${classes.glyph}`]: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    padding: (TOUCH_TARGET - PANEL_HEADER_GLYPH) / 2,
    marginLeft: -((TOUCH_TARGET - PANEL_HEADER_GLYPH) / 2),
  },

  // Centred on the bar rather than on the space beside the glyph, which is how the design places
  // it; taking it out of the flow keeps it centred whatever the leading control's width.
  [`& .${classes.centre}`]: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },

  [`& .${classes.title}`]: {
    fontSize: 16,
    lineHeight: '26px',
    fontWeight: 500,
  },

  // With a subtitle the title tightens to 16/19 and the subtitle sits under it at 12/14, as the
  // add-members bar draws them.
  [`&.${classes.withSubtitle}`]: {
    height: PANEL_HEADER_HEIGHT_WITH_SUBTITLE,
    flex: `0 0 ${PANEL_HEADER_HEIGHT_WITH_SUBTITLE}px`,

    [`& .${classes.title}`]: {
      lineHeight: '19px',
    },
  },

  [`& .${classes.subtitle}`]: {
    fontSize: 12,
    lineHeight: '14px',
  },

  [`& .${classes.action}`]: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    padding: '9px 12px',
    marginRight: -12,
    fontSize: 16,
    lineHeight: '26px',
    color: PANEL_ACTION_COLOR,
    '&:hover': {
      background: 'none',
    },
  },
}))

export interface PanelHeaderProps {
  title: string
  /** Drawn under the title, as the add-members bar shows the channel it is acting on. */
  subtitle?: string
  handleClose: () => void
  /** A trailing action such as Done; the designs pair one with a close, not with a back arrow. */
  action?: { label: string; onClick: () => void; testId?: string; disabled?: boolean }
  /**
   * The designs dismiss a panel with a back arrow, not a cross ("Create channel" 5055:16131);
   * panels without a design statement of their own can keep a cross.
   */
  leading?: 'back' | 'close'
  /** Test id for the dismiss control; panels have their own existing ids. */
  closeTestId?: string
  titleTestId?: string
}

/**
 * The header shared by right-hand side panels: dismiss on the left, centred title, rule beneath.
 * Extracted so panels stay consistent by construction rather than by each rebuilding the row.
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  subtitle,
  handleClose,
  action,
  leading = 'back',
  closeTestId,
  titleTestId,
}) => {
  return (
    <StyledHeader className={classNames(classes.root, { [classes.withSubtitle]: Boolean(subtitle) })}>
      <IconButton className={classes.glyph} onClick={handleClose} data-testid={closeTestId} size='small'>
        {leading === 'back' ? <ArrowBackIcon /> : <CloseIcon />}
      </IconButton>
      <span className={classes.centre}>
        <Typography className={classes.title} data-testid={titleTestId}>
          {title}
        </Typography>
        {subtitle && <Typography className={classes.subtitle}>{subtitle}</Typography>}
      </span>
      {action && (
        <Button
          className={classes.action}
          variant='text'
          onClick={action.onClick}
          disabled={action.disabled}
          data-testid={action.testId}
          disableRipple
        >
          {action.label}
        </Button>
      )}
    </StyledHeader>
  )
}

export default PanelHeader
