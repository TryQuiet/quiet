/* eslint-disable @typescript-eslint/no-unused-vars-experimental */
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
