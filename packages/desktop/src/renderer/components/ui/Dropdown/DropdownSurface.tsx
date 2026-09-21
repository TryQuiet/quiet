import { styled } from '@mui/material/styles'

/**
 * The panel every suggestion list sits on: white, a 1px #E5E5E5 hairline, radius 16.
 *
 * Both dropdowns in the app draw this — the emoji suggestions above the composer, and the
 * recipient results in a new DM's "To:" field (Figma tXuRsUfP6VnSv99dox00C1, d-search-results
 * 847:16073 / d-suggestion-results 840:20065, a 488-wide panel). They had each written the numbers
 * out separately and drifted; this is the one place they live now.
 *
 * Rows are laid edge to edge inside it, so the surface adds no padding of its own and the radius
 * is the only rounding.
 */
export const DROPDOWN_RADIUS = 16
export const DROPDOWN_BORDER_LIGHT = '#E5E5E5'
export const DROPDOWN_BORDER_DARK = '#333333'
export const DROPDOWN_BACKGROUND_DARK = '#2a2a2a'

export const dropdownSurfaceStyles = (isDark: boolean) => ({
  background: isDark ? DROPDOWN_BACKGROUND_DARK : '#ffffff',
  border: `1px solid ${isDark ? DROPDOWN_BORDER_DARK : DROPDOWN_BORDER_LIGHT}`,
  borderRadius: DROPDOWN_RADIUS,
  boxShadow: '0px 5px 20px rgba(0, 0, 0, 0.3)',
  padding: 0,
  overflowY: 'auto' as const,
  // A slim scrollbar, as the design draws it: 8 wide at 20% black, fully rounded.
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
    borderRadius: '100px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
  },
})

/** The design's row inside that panel: 56 tall, divided by a #F0F0F0 hairline, #F0F0F0 on hover. */
export const DROPDOWN_ROW_HEIGHT = 56
export const DROPDOWN_ROW_INSET = 16
export const DROPDOWN_ROW_DIVIDER = '#F0F0F0'

export const DropdownSurface = styled('div')<{ isDark?: boolean }>(({ theme }) =>
  dropdownSurfaceStyles(theme.palette.mode === 'dark')
)

export default DropdownSurface
