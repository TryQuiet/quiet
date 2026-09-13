import { alpha } from '@mui/material/styles'
import type { CSSObject, Theme } from '@mui/material/styles'

/**
 * Interaction states for the onboarding controls: hover, pressed (:active),
 * focus-visible (keyboard) and disabled, from the Quiet Design Library
 * (0j7Nna9zWmfOSNmRmQK1Uh):
 *
 * - Button row set 2989:185 — Hover fill #F0F0F0 (5577:41332); Disabled
 *   (4776:7879) fill #FFFFFF with title + caret #B3B3B3 (ActionRow colours
 *   those). No pressed or focus variants: pressed is the theme's
 *   action.selected, focus-visible the theme's ring.
 * - Button set 3505:10206 — Primary #521C74, Hover #461863, Disabled = the
 *   same at 30% opacity. No pressed variant: an inset activatedOpacity overlay.
 * - Text-only buttons — Hover = same colour + underline; no disabled or
 *   pressed variant: pressed dims like the app's buttons.
 * - Glyph buttons (LeftZ 3606:13753 / RightZ 3606:13778, title-bar icons
 *   4509:18339) — no designed hover or pressed: focus-visible ring only.
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

/** List rows (ListItemButton): the three-way choices and the Link devices rows. Disabled colours live in ActionRow. */
export const rowStates = (theme: Theme, strong = true): CSSObject => {
  const s = selectors(strong)
  return {
    cursor: 'pointer',
    transition: transition(theme),
    // Button row / Hover: fill #F0F0F0 — the palette's paper surface.
    [s.hover]: { backgroundColor: theme.palette.background.paper },
    [s.active]: { backgroundColor: theme.palette.action.selected },
    [s.focus]: { ...focusRing(theme, -2), backgroundColor: theme.palette.action.focus },
    [s.disabled]: { cursor: 'default' },
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
    // Button / Disabled: the primary colours at 30% opacity.
    [s.disabled]: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.common.white,
      opacity: 0.3,
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

/** Glyph buttons (title-bar back / close, reveal): no designed hover or pressed — the keyboard ring only, no ripple. */
export const glyphButtonStates = (theme: Theme, strong = true): CSSObject => {
  const s = selectors(strong)
  return {
    transition: transition(theme),
    [s.hover]: { backgroundColor: 'transparent' },
    [s.active]: { backgroundColor: 'transparent' },
    [s.focus]: { ...focusRing(theme, 0), backgroundColor: 'transparent' },
    [s.disabled]: { opacity: theme.palette.action.disabledOpacity },
  }
}
