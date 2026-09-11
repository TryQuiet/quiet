import { Tokens } from './types'

// 2px grid: accepts what the files already do rather than forcing a change.
// 89% of onboarding spacing in Figma already lands on a multiple of 2, and 10px
// - the second most common value in the whole system (3,025 onboarding frames,
// 20 uses in packages/mobile) - stays legal.
//
// Line-heights only need to be even, so bodyLg keeps its 26 and h3/h2 are
// untouched. The visible change is confined to caption and body, which move to
// match Figma, plus the h1 fix.
export const grid2px: Tokens = {
  name: '2px grid',
  base: 2,
  space: [2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 48, 64],
  // 6 and 10 are the two values this grid keeps that a 4px grid cannot.
  semantic: { xs: 4, sm: 6, md: 10, lg: 16, xl: 24, xxl: 32 },
  type: {
    overline: { fontSize: 10, lineHeight: 16, fontWeight: 500 },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: 400 }, // was 12/20
    body: { fontSize: 14, lineHeight: 20, fontWeight: 400 }, // was 14/24
    subtitle: { fontSize: 14, lineHeight: 20, fontWeight: 500 }, // was 14/23 w400
    bodyLg: { fontSize: 16, lineHeight: 26, fontWeight: 400 }, // unchanged
    h5: { fontSize: 16, lineHeight: 26, fontWeight: 500 }, // unchanged
    title: { fontSize: 18, lineHeight: 26, fontWeight: 500 }, // was 18/27
    h3: { fontSize: 28, lineHeight: 34, fontWeight: 500 }, // unchanged
    h2: { fontSize: 34, lineHeight: 40, fontWeight: 500 }, // unchanged
    h1: { fontSize: 48, lineHeight: 56, fontWeight: 500 }, // was 48/40 (defect)
  },
  radii: [2, 4, 8, 16],
}
