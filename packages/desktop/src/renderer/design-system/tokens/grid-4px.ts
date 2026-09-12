import { Tokens } from './types'

// The design system's spacing and type scale: 4px grid, Rubik at weights 400/500.
// Decided 2026-09-11; 10px is not a step (it snaps to 8 or 12, decided per use).
//
// Line-heights are all multiples of 4, which is what moves bodyLg (26 -> 24),
// title (18/27 -> 20/28), h3 (34 -> 36) and h2 (34 -> 32/40).
export const grid4px: Tokens = {
  name: '4px grid',
  base: 4,
  space: [4, 8, 12, 16, 24, 32, 48, 64],
  // sm and md are the only roles that move: 6 -> 8, and 10 -> 12.
  //
  // 10 is exactly equidistant between 8 and 12, so it does not "snap" anywhere -
  // it is a judgement call. 12 is used here because rounding half away from zero
  // is the common convention; choosing 8 instead would make every one of those
  // 3,025 Figma frames tighter rather than looser. Worth deciding deliberately.
  semantic: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  type: {
    overline: { fontSize: 10, lineHeight: 16, fontWeight: 500 },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: 400 }, // was 12/20
    body: { fontSize: 14, lineHeight: 20, fontWeight: 400 }, // was 14/24
    subtitle: { fontSize: 14, lineHeight: 20, fontWeight: 500 }, // was 14/23 w400
    bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: 400 }, // was 16/26
    h5: { fontSize: 16, lineHeight: 24, fontWeight: 500 }, // was 16/26
    title: { fontSize: 20, lineHeight: 28, fontWeight: 500 }, // was 18/27
    h3: { fontSize: 28, lineHeight: 36, fontWeight: 500 }, // was 28/34
    h2: { fontSize: 32, lineHeight: 40, fontWeight: 500 }, // was 34/40
    h1: { fontSize: 48, lineHeight: 56, fontWeight: 500 }, // was 48/40 (defect)
  },
  radii: [4, 8, 16],
}
