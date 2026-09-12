// Shared shape for every token set. One interface so `current`, `grid2px` and
// `grid4px` are structurally interchangeable and can be rendered side by side.

// Only Rubik 400 and 500 are bundled (8 woff2 subsets in src/renderer/fonts).
// Asking for 300/600/700 renders faux-bold and misrepresents the design, so the
// type here refuses them.
export type RubikWeight = 400 | 500

export interface TypeStyle {
  fontSize: number
  lineHeight: number
  fontWeight: RubikWeight
}

export type TypeRole =
  | 'overline'
  | 'caption'
  | 'body'
  | 'subtitle'
  | 'bodyLg'
  | 'h5'
  | 'title'
  | 'h3'
  | 'h2'
  | 'h1'

export const TYPE_ROLES: TypeRole[] = [
  'overline',
  'caption',
  'body',
  'subtitle',
  'bodyLg',
  'h5',
  'title',
  'h3',
  'h2',
  'h1',
]

/** Which MUI variant in theme.ts each role corresponds to today. */
export const MUI_VARIANT: Record<TypeRole, string> = {
  overline: 'overline',
  caption: 'caption',
  body: 'body2',
  subtitle: 'subtitle2',
  bodyLg: 'body1',
  h5: 'h5',
  title: 'h4',
  h3: 'h3',
  h2: 'h2',
  h1: 'h1',
}

/**
 * Named roles a layout asks for. Screens reference these, never raw numbers and
 * never an index into `space` - indices are not comparable across grids, since
 * the two scales have different lengths.
 */
export interface SemanticSpace {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  xxl: number
}

export const SEMANTIC_KEYS: (keyof SemanticSpace)[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']

export interface Tokens {
  /** Display name, shown in the specimen header. */
  name: string
  /** Grid base in px. `null` for `current`, which has no grid. */
  base: number | null
  /** Allowed spacing steps, ascending. */
  space: number[]
  /** What each role resolves to under this grid. This is what screens consume. */
  semantic: SemanticSpace
  type: Record<TypeRole, TypeStyle>
  radii: number[]
}

