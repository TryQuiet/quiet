import { createTheme, type Theme } from '@mui/material/styles'

import { lightTheme } from '../../theme'
import { MUI_VARIANT, Tokens, TYPE_ROLES } from '../tokens'

/**
 * Derive a MUI theme from a token set, so the app's real components can be
 * rendered under a candidate scale without editing any of them.
 *
 * Only TYPOGRAPHY is substituted. The spacing factor is deliberately left at
 * MUI's default 8:
 *
 *   - ~55% of component files hardcode px literals, which no theme can reach.
 *   - The ~40 `theme.spacing(n)` call sites were written expecting n*8, so
 *     changing the factor would halve or double them rather than snap them to a
 *     grid - a difference that would look dramatic and mean nothing.
 *
 * So what a real-component comparison shows is the type scale. That is also the
 * change that matters: caption and body are each 4px of leading away from the
 * Figma values, across 5,023 onboarding text nodes.
 */
export const createGridTheme = (tokens: Tokens): Theme => {
  const typography: Record<string, unknown> = {}
  for (const role of TYPE_ROLES) {
    const s = tokens.type[role]
    typography[MUI_VARIANT[role]] = {
      fontSize: s.fontSize,
      lineHeight: `${s.lineHeight}px`,
      fontWeight: s.fontWeight,
    }
  }
  // subtitle1 tracks bodyLg in theme.ts today; keep that relationship.
  typography.subtitle1 = {
    fontSize: tokens.type.bodyLg.fontSize,
    lineHeight: `${tokens.type.bodyLg.lineHeight}px`,
  }

  return createTheme(lightTheme, {
    typography,
    components: {
      // theme.ts pins the document body to 14/24; follow the token set instead.
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontSize: `${tokens.type.body.fontSize}px`,
            lineHeight: `${tokens.type.body.lineHeight}px`,
          },
        },
      },
    },
  })
}
