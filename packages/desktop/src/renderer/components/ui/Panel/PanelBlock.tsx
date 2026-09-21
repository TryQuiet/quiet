import { styled } from '@mui/material/styles'

import { PANEL_INSET } from './PanelHeader'

/**
 * A padded block inside a side panel — the design's "Frame 99" and "Frame 101" around the channel
 * name field and the submit button (Figma PVQ1Kjf6Cq8ng1czuVtvR8, "Create channel" 5055:16131):
 * 16 on every side, with 16 between the things inside it.
 *
 * Rows sit edge to edge and blocks are inset, which is why the inset lives here rather than on the
 * panel's content column.
 */
export const PanelBlock = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: PANEL_INSET,
  padding: PANEL_INSET,
}))

export default PanelBlock
