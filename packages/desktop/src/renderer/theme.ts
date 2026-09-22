import { createTheme, type Theme } from '@mui/material/styles'
import React, { useEffect, useState } from 'react'

import { designComponents, overlayShadow } from './design-system/theme/components'
import { tokens } from './design-system/tokens'
import type { TypeStyle } from './design-system/tokens/types'

const font = "'Rubik', sans-serif"
const fontLogs = 'Menlo Regular'

const px = (style: TypeStyle) => ({
  fontSize: style.fontSize,
  lineHeight: `${style.lineHeight}px`,
  fontWeight: style.fontWeight,
})

/**
 * The design system's Rubik scale (design-system/tokens), keyed by the MUI
 * variant each role maps to (design-system/tokens/types.ts MUI_VARIANT).
 * Only weights 400 and 500 are bundled.
 */
const typography = {
  fontFamily: [font, fontLogs].join(','),
  fontStyle: 'normal',
  fontWeight: 'normal',
  useNextVariants: true,
  overline: px(tokens.type.overline),
  caption: px(tokens.type.caption),
  body1: px(tokens.type.bodyLg),
  body2: px(tokens.type.body),
  subtitle1: px(tokens.type.bodyLg),
  subtitle2: px(tokens.type.subtitle),
  h1: px(tokens.type.h1),
  h2: px(tokens.type.h2),
  h3: px(tokens.type.h3),
  h4: px(tokens.type.title),
  h5: px(tokens.type.h5),
}

/** Spacing roles on the 4px grid: xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32. */
const space = tokens.semantic

/**
 * The design library's Button (Figma 0j7Nna9zWmfOSNmRmQK1Uh 3505:10206). Every variant is drawn at
 * radius 16; Large is 50 tall with 20/12 padding and a 16 label, Small 32 tall with 12/6 and a 14
 * label. Primary is the brand purple going darker on hover, Secondary is white inside a #B3B3B3
 * hairline going to #F7F7F7, Destructive is red going darker; a disabled button is the same button
 * at 30% opacity.
 */
const BUTTON_RADIUS = 16
const BUTTON_PRIMARY = '#521C74'
const BUTTON_PRIMARY_HOVER = '#461863'
const BUTTON_SECONDARY_BORDER = '#B3B3B3'
const BUTTON_SECONDARY_HOVER = '#F7F7F7'
const BUTTON_DESTRUCTIVE = '#D13135'
const BUTTON_DESTRUCTIVE_HOVER = '#BA272B'

// The library has two sizes and Large is the one forms use, so Large's metrics sit on the root and
// Small overrides them. MUI's default size is Medium, which the library does not have; leaving the
// metrics on the root means an unsized button lands on Large rather than on MUI's own defaults.
const buttonStyleOverrides = {
  root: {
    textTransform: 'none' as const,
    boxShadow: 'none',
    borderRadius: BUTTON_RADIUS,
    fontWeight: 400,
    minHeight: 50,
    padding: '12px 20px',
    fontSize: 16,
    lineHeight: '26px',
    '&:active': {
      boxShadow: 'none',
    },
    '&.Mui-disabled': {
      opacity: 0.3,
    },
  },
  sizeSmall: {
    minHeight: 32,
    padding: '6px 12px',
    fontSize: 14,
    lineHeight: '20px',
  },
  sizeLarge: {
    minHeight: 50,
    padding: '12px 20px',
    fontSize: 16,
    lineHeight: '26px',
  },
  containedPrimary: {
    backgroundColor: BUTTON_PRIMARY,
    '&:hover': {
      backgroundColor: BUTTON_PRIMARY_HOVER,
    },
    '&.Mui-disabled': {
      backgroundColor: BUTTON_PRIMARY,
      color: '#FFFFFF',
    },
  },
  containedError: {
    backgroundColor: BUTTON_DESTRUCTIVE,
    '&:hover': {
      backgroundColor: BUTTON_DESTRUCTIVE_HOVER,
    },
  },
  outlined: {
    borderColor: BUTTON_SECONDARY_BORDER,
    '&:hover': {
      borderColor: BUTTON_SECONDARY_BORDER,
      backgroundColor: BUTTON_SECONDARY_HOVER,
    },
  },
}

const lightTheme = createTheme({
  typography: {
    ...typography,
    // Caption colour is the library's `Caption` fill #999999 (gray40; Input3.0 5077:43242).
    caption: { ...typography.caption, color: '#999999' },
  },
  space,
  palette: {
    mode: 'light',
    background: {
      // Background colors (white-ish for light theme, black-ish for dark)
      default: '#ffffff',
      paper: '#F0F0F0',
    },
    // text: {}, // font colors (black-ish for light theme, white-ish for dark)
    primary: {
      // Primary Quiet brand purple
      main: '#521C74',
      dark: '#461863',
    },
    secondary: {
      // Secondary Quiet brand red (TODO: Make sure this is Secondary, not error/warning)
      main: '#E42656',
      dark: '#C41743',
    },
    error: {
      main: '#D13135',
    },
    warning: {
      main: '#FFCC00',
    },
    // TO BE ADDED IF NEEDED: Success, Warning, Neutral
    colors: {
      // Misc colors. For primary / secondary brand, text, and background colors, use those objects
      // For canonical colors, see: https://www.figma.com/file/0j7Nna9zWmfOSNmRmQK1Uh/Quiet-Design-Library?type=design&node-id=2667-0&mode=design&t=i0cXovHohRKxWGaA-0
      contrastText: '#000', // Contrasts with the background colors
      // Blues
      blue: '#2196f3',
      purple: '#521C74', // To be replaced with theme.palette.primary.main
      quietBlue: '#521c74', // To be replaced with theme.palette.primary.main
      darkPurple: '#4d1a6d', // To be replaced with theme.palette.primary.dark?
      lightPurple: '#F9EFFF',
      lushSky: '#67BFD3',
      lushSky12: '#EDF7FA',
      linkBlue: '#1B6FEC', // Used in a variety of places - likely wants to be split / consolidated
      blue02: '#2373EA', // The QR sheets' "Reset QR code" text link (2811:2601, 2932:3707); mobile palette `blue`
      // Reds
      red: '#FF0000', // Replace with D13135 ?
      hotRed: '#E42656', // Replaced by theme.palette.secondary.main?
      hotPink: '#E42656', // Replaced by theme.palette.secondary.main?
      // Grays (including white and black)
      white: '#FFFFFF',
      trueBlack: '#000000', // To be replaced with text color and border color
      ink: '#222222', // The library's text colour (fill of its text nodes) and the Tooltip-content fill (3490:10102)
      error10: '#FAEAEB', // The library's 'Light/Error 10' fill style (error banners)
      gray: '#e7e7e7',
      darkGray: '#7F7F7F',
      mediumGray: '#8d8d8d',
      lightGray: '#B2B2B2', // To be replaced with gray30?
      gray03: '#F7F7F7',
      gray30: '#FAFAFA', // Unused and not aligned with Figma
      gray40: '#999999',
      gray50: '#7F7F7F',
      gray60: '#767676', // "No linked devices" (2811:2575)
      gray70: '#4C4C4C',
      // Border colors
      border01: '#F0F0F0',
      border02: '#B3B3B3',
      border04: '#E5E5E5', // The library's bordered group / card (Link devices 2811:2575)
      border03: '#D2D2D2',
      // Other custom colors
      // The side nav in the private-channel designs (Figma PVQ1Kjf6Cq8ng1czuVtvR8, "Nav bar"
      // 838:9760) is the brand purple with the selected row at 20% white.
      sidebarBackground: '#521C74',
      sidebarSelected: '#FFFFFF33',
      sidebarHover: '#FFFFFF0C',
      // Status colors
      statusGreen: '#80B857', // The library's 'Core/Grass Green' - the Online indicator fill (4610:17230)
    },
  },
  componentSizes: {
    avatar: {
      small: 24,
      medium: 28,
      large: 40,
    },
    statusIndicator: {
      size: 11, // Total size including border
      borderWidth: 2,
      position: {
        right: 0,
        bottom: 2,
      },
    },
    dmMemberCountIndicator: {
      minSize: 14, // Total size including border
      maxSize: 16,
      borderWidth: 2,
      fontSize: 9,
      lineHeight: 12,
      position: {
        right: 4,
        bottom: 4,
      },
    },
    userListItem: {
      gap: 8,
    },
  },
  //@ts-ignore MUI types expect 25 shadows - see: https://github.com/mui/material-ui/issues/28820
  shadows: [
    'none',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 1px 0px #F0F0F0',
    '0px 1px 3px rgba(0, 0, 0, 0.0)',
    '0px 2px 25px rgba(0, 0, 0, 0.2)',
    '0px 1px 12px rgba(0, 0, 0, 0.09)',
    overlayShadow, // [6] the library's Overlay menu (5578:43731)
    // From here, this is just 18 repeats until we figure out shadows
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
    '0px 0px 4px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    // Inputs, tooltips, menus, dialogs and the body text: design-system/theme/components.ts.
    ...designComponents,
    MuiSnackbarContent: {
      // Replace with atomic Snackbar component. Put styling in that file.
      styleOverrides: {
        root: {
          wordBreak: 'break-all',
        },
      },
    },
    MuiButton: {
      styleOverrides: buttonStyleOverrides,
    },
    MuiOutlinedInput: {
      // Replace with atomic Input component. Put styling in that file.
      styleOverrides: {
        input: {},
      },
    },
    MuiPopover: {
      // Replace with atomic Popover component. Put styling in that file.
      styleOverrides: {
        paper: {
          borderRadius: 8,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFF',
        },
      },
    },
  },
})

const darkTheme = createTheme({
  typography: {
    ...typography,
    h6: {
      fontSize: 16,
      lineHeight: '26px',
      fontWeight: 500,
      color: '#fff',
    },
  },
  space,
  palette: {
    mode: 'dark',
    background: {
      // Background colors (white-ish for light theme, black-ish for dark)
      default: '#222222',
      paper: '#222222',
    },
    divider: '#2F2F2F',
    // text: {}, // font colors (black-ish for light theme, white-ish for dark)
    primary: {
      // Primary Quiet brand purple
      main: '#521C74',
      dark: '#461863',
    },
    secondary: {
      // Secondary Quiet brand red (TODO: Make sure this is Secondary, not error/warning)
      main: '#E42656',
      dark: '#C41743',
    },
    error: {
      main: '#D13135',
    },
    warning: {
      main: '#FFCC00',
    },
    // TO BE ADDED IF NEEDED: Success, Warning, Neutral
    colors: {
      // Misc colors. For primary / secondary brand, text, and background colors, use those objects
      // For canonical colors, see: https://www.figma.com/file/0j7Nna9zWmfOSNmRmQK1Uh/Quiet-Design-Library?type=design&node-id=2667-0&mode=design&t=i0cXovHohRKxWGaA-0
      contrastText: '#FFF', // Contrasts with the background colors
      // Blues
      blue: '#2196f3',
      purple: '#521C74', // To be replaced with theme.palette.primary.main
      quietBlue: '#521c74', // To be replaced with theme.palette.primary.main
      darkPurple: '#4d1a6d', // To be replaced with theme.palette.primary.dark?
      lightPurple: '#F9EFFF',
      lushSky: '#67BFD3',
      lushSky12: '#EDF7FA',
      linkBlue: '#59c0d5', // Used in a variety of places - likely wants to be split / consolidated
      blue02: '#2373EA', // The QR sheets' "Reset QR code" text link (2811:2601, 2932:3707); mobile palette `blue`
      // Reds
      red: '#FF0000', // Replace with D13135 ?
      hotRed: '#E42656', // Replaced by theme.palette.secondary.main?
      hotPink: '#E42656', // Replaced by theme.palette.secondary.main?
      // Grays (including white and black)
      white: '#FFFFFF',
      trueBlack: '#000000', // To be replaced with text color and border color
      ink: '#222222', // The library's text colour (fill of its text nodes) and the Tooltip-content fill (3490:10102)
      error10: '#FAEAEB', // The library's 'Light/Error 10' fill style (error banners)
      gray: '#e7e7e7',
      darkGray: '#7F7F7F',
      mediumGray: '#8d8d8d',
      lightGray: '#B2B2B2', // To be replaced with gray30?
      gray03: '#F7F7F7',
      gray30: '#FAFAFA', // Unused and not aligned with Figma
      gray40: '#999999',
      gray50: '#7F7F7F',
      gray60: '#767676', // "No linked devices" (2811:2575)
      gray70: '#4C4C4C',
      // Border colors
      border01: '#2F2F2F',
      border02: '#B3B3B3',
      border04: '#E5E5E5', // The library's bordered group / card (Link devices 2811:2575)
      border03: '#D2D2D2',
      // Gradients and other run-of-the-mill things
      sidebarBackground: '#2F193D',
      sidebarSelected: '#FFFFFF33',
      sidebarHover: '#FFFFFF0C',
      // Status colors
      statusGreen: '#80B857', // The library's 'Core/Grass Green' - the Online indicator fill (4610:17230)
    },
  },
  componentSizes: {
    avatar: {
      small: 24,
      medium: 28,
      large: 40,
    },
    statusIndicator: {
      size: 11, // Total size including border
      borderWidth: 2,
      position: {
        right: 0,
        bottom: 2,
      },
    },
    dmMemberCountIndicator: {
      minSize: 14, // Total size including border
      maxSize: 16,
      borderWidth: 2,
      fontSize: 9,
      lineHeight: 12,
      position: {
        right: 4,
        bottom: 4,
      },
    },
    userListItem: {
      gap: 8,
    },
  },
  //@ts-ignore MUI types expect 25 shadows
  shadows: [
    'none',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 1px 0px #0F0F0F',
    '0px 1px 3px rgba(1, 1, 1, 0.0)',
    '0px 2px 25px rgba(1, 1, 1, 0.2)',
    '0px 1px 12px rgba(255, 255, 255, 0.1)', // White shadow for floating elements in dark mode
    overlayShadow, // [6] the library's Overlay menu (5578:43731)
    // Repeats until we design our shadows
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
    '0px 0px 4px rgba(1, 1, 1, 0.25)',
  ],
  components: {
    // Inputs, tooltips, menus, dialogs and the body text: design-system/theme/components.ts.
    ...designComponents,
    MuiSnackbarContent: {
      // Replace with atomic Snackbar component. Put styling in that file.
      styleOverrides: {
        root: {
          wordBreak: 'break-all',
        },
      },
    },
    MuiButton: {
      styleOverrides: buttonStyleOverrides,
    },
    MuiOutlinedInput: {
      // Replace with atomic Input component. Put styling in that file.
      styleOverrides: {
        input: {},
      },
    },
    MuiPopover: {
      // Replace with atomic Popover component. Put styling in that file.
      styleOverrides: {
        paper: {
          borderRadius: 8,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },
  },
})

const defaultTheme = darkTheme
const getCurrentTheme = (useDarkTheme: boolean | undefined): Theme => {
  if (useDarkTheme == null) {
    return defaultTheme
  }

  return useDarkTheme ? darkTheme : lightTheme
}

/**
 * Check if dark mode is enabled natively in the OS and use an effect to get realtime updates to dark mode settings
 * from the OS.
 *
 * NOTE: Defaults to the theme above
 *
 * @returns Theme that matches system theme
 */
const useTheme = (): Theme => {
  const mediaQuery = () => (window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null)
  const [isDarkTheme, setDarkTheme] = useState<Theme>(
    mediaQuery != null ? getCurrentTheme(mediaQuery()?.matches) : defaultTheme
  )

  useEffect(() => {
    const mediaQueryResult = mediaQuery()
    if ((mediaQueryResult as MediaQueryList).addEventListener != null) {
      ;(mediaQueryResult as MediaQueryList).addEventListener('change', event => {
        setDarkTheme(getCurrentTheme(event.matches))
      })
    } else {
      setDarkTheme(defaultTheme)
    }
  }, [])

  return isDarkTheme
}

export { lightTheme, darkTheme, defaultTheme, useTheme }
