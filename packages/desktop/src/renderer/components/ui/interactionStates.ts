import { alpha } from '@mui/material/styles'
import type { CSSObject, Theme } from '@mui/material/styles'

/**
 * Interaction states for the onboarding controls: hover, pressed (:active),
 * focus-visible (keyboard) and disabled. The design library has no state
 * variants for these controls yet, so the values are the MUI theme's action
 * tokens (`theme.palette.action.*`) and the brand palette; when Figma values
 * land they replace the tokens here, in one place.
 *
 * Every state changes colour, opacity, outline or shadow only — never a size,
 * border or padding — so nothing shifts on hover. Transitions stay at
 * STATE_TRANSITION_MS.
 */

/** Story-only: a story wraps a control in one of these classes to show the state without a pointer. */
export const FORCE_STATE = { hover: 'force-hover', active: 'force-active', focus: 'force-focus' } as const

export const STATE_TRANSITION_MS = 120

/**
 * Selectors for one control. `strong` doubles the generated class (`&&`) so
 * the state rules beat a parent's class override without `!important`; use
 * `strong: false` when the rules sit under a nested class selector.
 */
const selectors = (strong: boolean) => {
  const amp = strong ? '&&' : '&'
  return {
    hover: `${amp}:hover, .${FORCE_STATE.hover} ${amp}`,
    active: `${amp}:active, .${FORCE_STATE.active} ${amp}`,
    focus: `${amp}.Mui-focusVisible, ${amp}:focus-visible, .${FORCE_STATE.focus} ${amp}`,
    disabled: `${amp}.Mui-disabled, ${amp}:disabled`,
  }
}

const transition = (theme: Theme) =>
  theme.transitions.create(
    ['background-color', 'color', 'opacity', 'box-shadow', 'outline-color', 'text-decoration-color'],
    { duration: STATE_TRANSITION_MS }
  )

const focusRing = (theme: Theme, offset: number): CSSObject => ({
  outline: `2px solid ${theme.palette.primary.main}`,
  outlineOffset: offset,
})

/** List rows (ListItemButton): the three-way choices and the Link devices rows. */
export const rowStates = (theme: Theme, strong = true): CSSObject => {
  const s = selectors(strong)
  return {
    cursor: 'pointer',
    transition: transition(theme),
    [s.hover]: { backgroundColor: theme.palette.action.hover },
    [s.active]: { backgroundColor: theme.palette.action.selected },
    [s.focus]: { ...focusRing(theme, -2), backgroundColor: theme.palette.action.focus },
    [s.disabled]: { opacity: theme.palette.action.disabledOpacity, cursor: 'default' },
  }
}

/** Filled primary button (Continue, Copy to clipboard). */
export const primaryButtonStates = (theme: Theme, strong = true): CSSObject => {
  const s = selectors(strong)
  return {
    transition: transition(theme),
    boxShadow: 'none',
    [s.hover]: { backgroundColor: theme.palette.primary.dark, boxShadow: 'none' },
    [s.active]: {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: `inset 0 0 0 999px ${alpha(theme.palette.common.black, theme.palette.action.activatedOpacity)}`,
    },
    [s.focus]: focusRing(theme, 2),
    [s.disabled]: {
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.disabledOpacity),
      color: theme.palette.common.white,
      opacity: 1,
    },
  }
}

/** Text link rendered as a button (Paste a link): the underline fades in, pressed dims like the app's buttons. */
export const textLinkStates = (theme: Theme, strong = true): CSSObject => {
  const s = selectors(strong)
  return {
    cursor: 'pointer',
    transition: transition(theme),
    textDecoration: 'underline',
    textDecorationColor: 'transparent',
    textUnderlineOffset: 3,
    borderRadius: 2,
    [s.hover]: { textDecorationColor: 'currentColor' },
    [s.active]: { opacity: 0.7 },
    [s.focus]: focusRing(theme, 2),
    [s.disabled]: { opacity: theme.palette.action.disabledOpacity, cursor: 'default' },
  }
}

/** Glyph buttons (title-bar back / close, reveal): a round tint, no ripple. */
export const glyphButtonStates = (theme: Theme, strong = true): CSSObject => {
  const s = selectors(strong)
  return {
    transition: transition(theme),
    [s.hover]: { backgroundColor: theme.palette.action.hover },
    [s.active]: { backgroundColor: theme.palette.action.selected },
    [s.focus]: { ...focusRing(theme, 0), backgroundColor: 'transparent' },
    [s.disabled]: { opacity: theme.palette.action.disabledOpacity },
  }
}
