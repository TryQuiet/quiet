import { alpha } from '@mui/material/styles'
import type { Components, Theme } from '@mui/material/styles'

import { tokens } from '../tokens'

/**
 * MUI component overrides taken from the Quiet Design Library
 * (Figma file 0j7Nna9zWmfOSNmRmQK1Uh) and the 4px-grid tokens, applied by
 * theme.ts to the light and dark themes alike. Every value cites the library
 * node it comes from; the spacing is expressed in the grid's roles.
 *
 * Owned here so a control looks the same wherever it is used - components
 * should not restate these numbers.
 */

const { semantic: space, type, radii } = tokens

/** Corner radii the library uses: 4 (avatars ≤36), 8 (inputs, modals, tooltips), 16 (menus, big buttons). */
export const radius = { sm: radii[0], md: radii[1], lg: radii[2] }

/**
 * `Overlay menu` (5578:43731): DROP_SHADOW 0 6 30 #000000 @ 0.11.
 * The floating `Date marker` (5063:27435) is 0 1 12 @ 0.10 - theme.shadows[5].
 * `modal/small` (3505:10356) is 0 2 25 @ 0.20 - theme.shadows[4].
 */
export const overlayShadow = '0px 6px 30px rgba(0, 0, 0, 0.11)'

/**
 * Secondary button: the library's `Button` next to the filled action in
 * `action bar / Buttons=Single with Cancel` (3505:10321) - white, 1px #B3B3B3
 * (border02), Rubik 14/20 w400, padding 6/12. Wired into MuiButton by theme.ts.
 * Its corner radius follows the primary button's (MuiButton root), which is
 * being set on design/onboarding-impl.
 */
export const buttonOutlined = ({ theme }: { theme: Theme }) => ({
  textTransform: 'none' as const,
  fontSize: type.body.fontSize,
  lineHeight: `${type.body.lineHeight}px`,
  fontWeight: type.body.fontWeight,
  paddingTop: 6,
  paddingBottom: 6,
  paddingLeft: space.md,
  paddingRight: space.md,
  color: theme.palette.text.primary,
  borderColor: theme.palette.colors.border02,
  backgroundColor: theme.palette.background.default,
  '&:hover': {
    borderColor: theme.palette.colors.border02,
    backgroundColor: theme.palette.action.hover,
  },
})

export const designComponents: Components<Theme> = {
  // Body text is the `body` role (14/20). theme.ts used to pin 14/24 here.
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        fontSize: `${type.body.fontSize}px`,
        lineHeight: `${type.body.lineHeight}px`,
        letterSpacing: '0.01071em',
      },
    },
  },

  // `Input3.0` (5077:43258; the box is 5077:43158): 42 tall, radius 8, 1px #999999
  // (gray40), 16px side padding, text 14 in a 24px slot; focussed stroke #1B6FEC
  // (linkBlue, 5077:43164); placeholder #7F7F7F (darkGray, 1933:47078 'Send a message').
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: radius.md,
        fontSize: type.body.fontSize,
        lineHeight: '24px',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.colors.gray40,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.colors.gray70,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.colors.linkBlue,
          borderWidth: 1,
        },
        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.error.main,
        },
        '&.MuiInputBase-multiline': {
          padding: `${space.sm}px ${space.lg}px`,
        },
      }),
      input: ({ theme }) => ({
        height: 24,
        padding: `${space.sm}px ${space.lg}px`,
        '&::placeholder': {
          color: theme.palette.colors.darkGray,
          opacity: 1,
        },
      }),
      inputMultiline: {
        padding: 0,
      },
    },
  },

  // `Tooltip-content` (3490:10102): fill #222222 (ink), radius 8, padding 8/16,
  // Rubik 14/20 w400 white; the caret (3490:10085) is the same ink.
  MuiTooltip: {
    styleOverrides: {
      tooltip: ({ theme }) => ({
        backgroundColor: theme.palette.colors.ink,
        color: theme.palette.colors.white,
        fontSize: type.body.fontSize,
        lineHeight: `${type.body.lineHeight}px`,
        fontWeight: type.body.fontWeight,
        padding: `${space.sm}px ${space.lg}px`,
        borderRadius: radius.md,
      }),
      arrow: ({ theme }) => ({
        color: theme.palette.colors.ink,
      }),
    },
  },

  // `Overlay menu` (5578:43731): white, radius 16, 16px top/bottom padding, rows
  // are `Button row` 48 tall (16/26 text inside 11px padding -> 12px on the grid).
  MuiPopover: {
    styleOverrides: {
      paper: {
        borderRadius: radius.lg,
        boxShadow: overlayShadow,
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      list: {
        paddingTop: space.lg,
        paddingBottom: space.lg,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        minHeight: 48,
        padding: `${space.md}px ${space.lg}px`,
        fontSize: type.bodyLg.fontSize,
        lineHeight: `${type.bodyLg.lineHeight}px`,
      },
    },
  },

  // `modal/small` (3505:10356): radius 8, shadow 0 2 25 @ 0.20 (theme.shadows[4]).
  MuiDialog: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: radius.md,
        boxShadow: theme.shadows[4],
      }),
    },
  },

  // `Search result` (3799:12467): rows 36 tall, padding 8/16, 14/20; hover is a
  // 6% black wash (5671:24701), selected is #1B6FEC with white text (3799:12466).
  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        '&.Mui-selected': {
          backgroundColor: theme.palette.colors.linkBlue,
          color: theme.palette.colors.white,
          '&:hover': {
            backgroundColor: theme.palette.colors.linkBlue,
          },
        },
      }),
    },
  },
}

/** The library's row hover: `Search result / State=Hover` frame fill #000000 @ 0.06 (5671:24701). */
export const rowHover = (theme: Theme) => alpha(theme.palette.common.black, 0.06)
