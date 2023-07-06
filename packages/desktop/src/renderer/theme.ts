import { createTheme } from '@mui/material/styles'

const font = "'Rubik', sans-serif"
const fontLogs = 'Menlo Regular'

export default createTheme({
  typography: {
    fontFamily: [font, fontLogs].join(','),
    fontStyle: 'normal',
    fontWeight: 'normal',
    useNextVariants: true,
    overline: {
      fontSize: 10,
      lineHeight: '16px',
      fontWeight: 500,
    },
    caption: {
      fontSize: 12,
      lineHeight: '20px',
      color: '#b2b2b2',
    },
    body1: {
      fontSize: 16,
      lineHeight: '26px',
    },
    body2: {
      fontSize: 14,
      lineHeight: '24px',
    },
    subtitle1: {
      fontSize: 16,
      lineHeight: '26px',
    },
    subtitle2: {
      fontSize: 14,
      lineHeight: '23px',
    },
    h1: {
      fontWeight: 500,
      fontSize: 48,
      lineHeight: '40px',
    },
    h2: {
      fontWeight: 500,
      fontSize: 34,
      lineHeight: '40px',
    },
    h3: {
      fontWeight: 500,
      fontSize: 28,
      lineHeight: '34px',
    },
    h4: {
      fontWeight: 500,
      fontSize: 18,
      lineHeight: '27px',
    },
    h5: {
      fontSize: 16,
      lineHeight: '26px',
      fontWeight: 500,
    },
  },
  palette: {
    primary: {
      light: '#e9e9e9',
      main: '#8d8d8d',
      dark: '#4a4a4a',
    },
    colors: {
      contentGray: '#D2D2D2',
      titleGray: '#555555',
      white: '#FFFFFF',
      blue: '#2196f3',
      purple: '#521C74',
      darkPurple: '#4d1a6d',
      gray: '#e7e7e7',
      inputGray: '#E0E0E0',
      black: '#333333',
      trueBlack: '#000000',
      quietBlue: '#521c74',
      captionPurple: '#9B60A5',
      darkGray: '#7F7F7F',
      gray03: '#F7F7F7',
      gray40: '#999999',
      lushSky: '#67BFD3',
      lushSky12: '#EDF7FA',
      lightGray: '#B2B2B2',
      veryLightGray: '#F0F0F0',
      green: '#4CBB17',
      greenDark: '#9BD174',
      red: '#FF0000',
      hotRed: '#E42656',
      hotPink: '#E42656',
      linkBlue: '#59c0d5',
      buttonGray: '#E3E3E3',
      black30: '#4C4C4C',
      gray30: '#FAFAFA',
      grayBackgroud: '#F3F0F6',
      gray50: '#B3B3B3',
      error: '#D13135',
      logsDark: '#252526',
      logsActiveDark: '#1E1E1E',
      logsInactiveDark: '#2D2D2D',
      logsTitleGray: '#D4D4D4',
      logsTabWhite: '#A9A9A9',
      logsScrollBar: '#3D3D3D',
      logsScrollBarThumb: ' #787878',
      yellow: '#E6BB46',
    },
  },
  components: {
    // Body font size changed in mui v5: https://mui.com/material-ui/migration/v5-component-changes/#update-body-font-size
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontSize: '14px',
          lineHeight: '24px',
          letterSpacing: '0.01071em',
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          wordBreak: 'break-all',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        sizeSmall: {
          textTransform: 'none',
          boxShadow: 'none',
          paddingLeft: '16px',
          paddingRight: '14px',
          fontWeight: 400,
          fontSize: '14px',
          '&:active': {
            boxShadow: 'none',
          },
        },
        sizeLarge: {
          textTransform: 'none',
          boxShadow: 'none',
          fontWeight: 400,
          paddingTop: 12,
          paddingBottom: 12,
          fontSize: 14,
          '&:active': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {},
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
        },
      },
    },
  },
})
