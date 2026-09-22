// import { Palette } from 'styled-components';

// export const defaultPalette: Palette = {
export const defaultPalette = {
  main: {
    brand: '#521C74',
    white: '#ffffff',
  },
  statusBar: {
    main: '#CB444E',
  },
  appBar: {
    gray: '#E5E5E5',
  },
  typography: {
    main: '#000000',
    subtitle: '#999999',
    link: '#67BFD3',
    hint: '#999999',
    error: '#E42656',
    // The destructive red the designs use for entries like "Delete channel" (Figma
    // PVQ1Kjf6Cq8ng1czuVtvR8, 838:9190), and the same value desktop calls BUTTON_DESTRUCTIVE. It is
    // not the error red above, which belongs to validation messages.
    destructive: '#D13135',
    grayLight: '#B8B8B8',
    veryLightGray: '#F0F0F0',
    grayDark: '#999999',
    gray50: '#7F7F7F',
    gray60: '#767676', // "No linked devices" (2811:2575)
    gray70: '#4C4C4C',
    gray90: '#222222',
    white: '#ffffff',
    blue: '#2373EA',
    lightGray: '#B2B2B2',
    darkPurple: '#461863',
    // Community home list text and glyphs (Figma: Community home 5446:76594).
    charcoal: '#222222',
    // Letter on the community icon tile.
    vividPurple: '#9C00FF',
  },
  // Desktop theme.ts: border01 / border02 / border04
  border: {
    hairline: '#F0F0F0',
    card: '#E5E5E5', // The library's bordered group / card (Link devices 2811:2575)
    qrBox: '#B3B3B3', // qr-code-box (2811:2601)
  },
  input: {
    // Field values from the design library's "Input 2.0 base": a #B3B3B3 hairline at radius 16.
    // Input 2.0 defines no states, so focus, error and disabled come from Input3.0 (5077:43258).
    border: '#B3B3B3',
    borderFocus: '#1B6FEC',
    borderError: '#D13135',
    borderDisabled: '#E5E5E5',
    borderLightPurple: '#ECDCF5',
    backgroundDefault: '#ffffff',
    backgroundDisabled: '#F0F0F0',
  },
  background: {
    white: '#ffffff',
    black: '#000000',
    // Named after the desktop token of the same value; the DM design library uses it for the
    // recipient pills and the compose toolbar rule.
    gray03: '#F7F7F7',
    gray06: '#F0F0F0',
    gray70: '#4C4C4C',
    blue: '#2373EA',
    lushSky: '#67BFD3',
    lightPurple: '#F3E8FF',
    // The pale purple the design library fills its pills with (Want a server? 2922:10009,
    // "It's free!"); desktop holds the same value as colors.lightPurple.
    lightPurple03: '#F9EFFF',
    grassGreen: '#80B857',
    // Community icon tile behind the community's initial.
    paleLavender: '#F9F0FF',
    hotPink: '#E42656',
    grayBadge: '#C3C3C3',
  },
}
