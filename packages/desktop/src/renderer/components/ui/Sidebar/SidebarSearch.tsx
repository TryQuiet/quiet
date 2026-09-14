import React from 'react'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { SearchGlyphIcon } from './sidebarIcons'
import { sidebarMetrics } from './sidebarMetrics'

const PREFIX = 'SidebarSearch'

const classes = {
  root: `${PREFIX}root`,
  button: `${PREFIX}button`,
  glyph: `${PREFIX}glyph`,
  label: `${PREFIX}label`,
}

const StyledSearch = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    boxSizing: 'border-box',
    width: '100%',
    padding: `0 ${sidebarMetrics.header.paddingX}px`,
  },

  [`& .${classes.button}`]: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: sidebarMetrics.search.height,
    padding: sidebarMetrics.search.padding,
    gap: sidebarMetrics.search.gap,
    borderRadius: sidebarMetrics.search.radius,
    // The library's own values for the field on the purple column.
    backgroundColor: 'rgba(0, 0, 0, 0.10)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: theme.palette.colors.white,
    cursor: 'pointer',
    textAlign: 'left',
    '&:hover': {
      borderColor: 'rgba(255, 255, 255, 0.24)',
    },
  },

  [`& .${classes.glyph}`]: {
    flexShrink: 0,
    display: 'flex',
    width: sidebarMetrics.search.glyph,
    height: sidebarMetrics.search.glyph,
    opacity: sidebarMetrics.opacity.searchGlyph,
  },

  [`& .${classes.label}`]: {
    opacity: sidebarMetrics.opacity.searchLabel,
    letterSpacing: 0.4,
    color: theme.palette.colors.white,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}))

export interface SidebarSearchProps {
  onClick: () => void
}

/**
 * `Search input` from the Quiet Design Library. It is a button, not a field:
 * Quiet's channel search is the existing modal on Ctrl/Cmd+K, and this gives it
 * the affordance the design draws instead of leaving it keyboard-only.
 */
export const SidebarSearch: React.FC<SidebarSearchProps> = ({ onClick }) => {
  return (
    <StyledSearch className={classes.root}>
      <button type='button' className={classes.button} onClick={onClick} data-testid='sidebar-search-button'>
        <span className={classes.glyph}>
          <SearchGlyphIcon />
        </span>
        <Typography variant='caption' className={classes.label}>
          Search
        </Typography>
      </button>
    </StyledSearch>
  )
}

export default SidebarSearch
