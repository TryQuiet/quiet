/**
 * Spacing roles on the 4px grid. Mirrors
 * packages/desktop/src/renderer/design-system/tokens/grid-4px.ts (semantic):
 * xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32.
 *
 * Layouts ask for a role, never a raw number.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

export type SpacingRole = keyof typeof spacing
