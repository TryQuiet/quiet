/* eslint-disable @typescript-eslint/no-unused-vars */
import { Typography, TypographyOptions } from '@mui/material/styles/createTypography'
import { Palette, PaletteOptions } from '@mui/material/styles/createPalette'

declare module '@mui/material/styles/createTypography' {
  interface Typography {
    fontStyle: string
    fontWeight: string
    useNextVariants: boolean
  }
  interface TypographyOptions {
    fontStyle?: string
    fontWeight?: string
    useNextVariants?: boolean
  }
}

declare module '@mui/material/styles/createPalette' {
  interface Palette {
    colors: { [key: string]: string }
  }
  interface PaletteOptions {
    colors?: { [key: string]: string }
  }
}

declare module '@mui/material/styles' {
  interface Theme {
    componentSizes: {
      avatar: {
        small: number
        medium: number
        large: number
      }
      statusIndicator: {
        size: number
        borderWidth: number
        position: {
          right: number
          bottom: number
        }
      }
      userListItem: {
        gap: number
      }
    }
  }
  interface ThemeOptions {
    componentSizes?: {
      avatar?: {
        small?: number
        medium?: number
        large?: number
      }
      statusIndicator?: {
        size?: number
        borderWidth?: number
        position?: {
          right?: number
          bottom?: number
        }
      }
      userListItem?: {
        gap?: number
      }
    }
  }
}
