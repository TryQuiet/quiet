import React from 'react'

import { IconButton, Typography } from '@mui/material'
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
export const PANEL_HEADER_GLYPH = 28
export const PANEL_HEADER_INSET = 14

/** Content inset shared by the side panels. */
export const PANEL_INSET = 16

/** Width of a side panel's content column, matching the 375 the mobile screens use. */
export const PANEL_WIDTH = 375

const PREFIX = 'PanelHeader'

const classes = {
  root: `${PREFIX}root`,
  glyph: `${PREFIX}glyph`,
  title: `${PREFIX}title`,
}

const StyledHeader = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    height: PANEL_HEADER_HEIGHT,
    flex: `0 0 ${PANEL_HEADER_HEIGHT}px`,
    paddingLeft: PANEL_HEADER_INSET,
    paddingRight: PANEL_HEADER_INSET,
    borderBottom: `1px solid ${theme.palette.colors.border01}`,
    backgroundColor: theme.palette.background.default,
  },

  [`& .${classes.glyph}`]: {
    width: PANEL_HEADER_GLYPH,
    height: PANEL_HEADER_GLYPH,
    padding: 0,
  },

  // Centred on the bar rather than on the space beside the glyph, which is how the design places
  // it; taking it out of the flow keeps it centred whatever the leading control's width.
  [`& .${classes.title}`]: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    pointerEvents: 'none',
    fontSize: 16,
    lineHeight: '26px',
    fontWeight: 500,
  },
}))

export interface PanelHeaderProps {
  title: string
  handleClose: () => void
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
  handleClose,
  leading = 'back',
  closeTestId,
  titleTestId,
}) => {
  return (
    <StyledHeader className={classes.root}>
      <IconButton className={classes.glyph} onClick={handleClose} data-testid={closeTestId} size='small'>
        {leading === 'back' ? <ArrowBackIcon /> : <CloseIcon />}
      </IconButton>
      <Typography className={classes.title} data-testid={titleTestId}>
        {title}
      </Typography>
    </StyledHeader>
  )
}

export default PanelHeader
