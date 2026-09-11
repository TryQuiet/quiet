import { Tokens } from './types'

// Transcribed verbatim from packages/desktop/src/renderer/theme.ts (lightTheme).
// This is the "before" column: what the app ships today, not a proposal.
//
// Two values here are defects rather than choices:
//   h1  48/40 - line-height is SMALLER than the font size.
//   h2  34/40 - leading of 1.18, tighter than any other role.
export const current: Tokens = {
  name: 'theme.ts today',
  base: null, // there is no spacing override in theme.ts; MUI's default 8 factor applies
  // Not a scale - these are the spacing literals actually found hardcoded across
  // src/renderer/components (by frequency: 16, 24, 8, 5, 12, 32, 10, 4, 20, 2).
  space: [1, 2, 4, 5, 8, 10, 12, 16, 20, 24, 30, 32],
  // Approximated from the most common literals at each role in the real files.
  semantic: { xs: 4, sm: 5, md: 10, lg: 16, xl: 24, xxl: 32 },
  type: {
    overline: { fontSize: 10, lineHeight: 16, fontWeight: 500 },
    caption: { fontSize: 12, lineHeight: 20, fontWeight: 400 },
    body: { fontSize: 14, lineHeight: 24, fontWeight: 400 },
    subtitle: { fontSize: 14, lineHeight: 23, fontWeight: 400 },
    bodyLg: { fontSize: 16, lineHeight: 26, fontWeight: 400 },
    h5: { fontSize: 16, lineHeight: 26, fontWeight: 500 },
    title: { fontSize: 18, lineHeight: 27, fontWeight: 500 },
    h3: { fontSize: 28, lineHeight: 34, fontWeight: 500 },
    h2: { fontSize: 34, lineHeight: 40, fontWeight: 500 },
    h1: { fontSize: 48, lineHeight: 40, fontWeight: 500 },
  },
  radii: [2, 4, 8, 15, 16],
}
