import React from 'react'

import { Divider, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { styled } from '@mui/material/styles'

const PREFIX = 'PanelHeader'

const classes = {
  root: `${PREFIX}root`,
  title: `${PREFIX}title`,
  spacer: `${PREFIX}spacer`,
}

const StyledHeader = styled('div')(() => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    paddingLeft: PANEL_INSET,
    paddingRight: PANEL_INSET,
    flexWrap: 'nowrap',
  },

  [`& .${classes.title}`]: {
    flexGrow: 1,
    textAlign: 'center',
    fontWeight: 500,
  },

  // Balances the close button so the title is centred on the panel, not on the space beside it.
  [`& .${classes.spacer}`]: {
    visibility: 'hidden',
  },
}))

/** Content inset shared by the side panels. */
export const PANEL_INSET = 16

/** Width of a side panel's content column, matching the 375 the mobile screens use. */
export const PANEL_WIDTH = 375

export interface PanelHeaderProps {
  title: string
  handleClose: () => void
  /** Test id for the close control; panels have their own existing ids. */
  closeTestId?: string
  titleTestId?: string
}

/**
 * The header shared by right-hand side panels: close on the left, centred title, divider beneath.
 * Extracted so panels stay consistent by construction rather than by each rebuilding the row.
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({ title, handleClose, closeTestId, titleTestId }) => {
  return (
    <>
      <StyledHeader className={classes.root}>
        <IconButton onClick={handleClose} data-testid={closeTestId} size='small'>
          <CloseIcon />
        </IconButton>
        <Typography className={classes.title} data-testid={titleTestId}>
          {title}
        </Typography>
        <IconButton className={classes.spacer} disabled size='small' tabIndex={-1} aria-hidden>
          <CloseIcon />
        </IconButton>
      </StyledHeader>
      <Divider />
    </>
  )
}

export default PanelHeader
