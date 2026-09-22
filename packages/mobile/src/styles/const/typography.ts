import type { FontWeight } from '../../components/Typography/Typography.types'

/**
 * Rubik type scale on the 4px grid. Mirrors
 * packages/desktop/src/renderer/design-system/tokens/grid-4px.ts (type).
 * Only Rubik 400 (normal) and 500 (medium) are part of the scale.
 */
export type TypeVariant = 'overline' | 'caption' | 'body' | 'subtitle' | 'bodyLg' | 'h5' | 'title' | 'h3' | 'h2' | 'h1'

export interface TypeStyle {
  fontSize: number
  lineHeight: number
  fontWeight: Extract<FontWeight, 'normal' | 'medium'>
}

export const typeScale: Record<TypeVariant, TypeStyle> = {
  overline: { fontSize: 10, lineHeight: 16, fontWeight: 'medium' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: 'normal' },
  body: { fontSize: 14, lineHeight: 20, fontWeight: 'normal' },
  subtitle: { fontSize: 14, lineHeight: 20, fontWeight: 'medium' },
  bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: 'normal' },
  h5: { fontSize: 16, lineHeight: 24, fontWeight: 'medium' },
  title: { fontSize: 20, lineHeight: 28, fontWeight: 'medium' },
  h3: { fontSize: 28, lineHeight: 36, fontWeight: 'medium' },
  h2: { fontSize: 32, lineHeight: 40, fontWeight: 'medium' },
  h1: { fontSize: 48, lineHeight: 56, fontWeight: 'medium' },
}
