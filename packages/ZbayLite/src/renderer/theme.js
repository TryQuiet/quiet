import '../renderer/fonts/app.scss'
import { createMuiTheme } from '@material-ui/core/styles'

const font = "'Rubik', sans-serif"

export default createMuiTheme({
  typography: {
    fontFamily: [font].join(','),
    fontStyle: 'normal',
    fontWeight: 'normal',
    useNextVariants: true,
    overline: {
      fontSize: 10,
      lineHeight: '16px',
      fontWeight: 500
    },
    caption: {
      fontSize: 12,
      lineHeight: '20px',
      letterSpacing: '0.4px',
      color: '#b2b2b2'
    },
    body1: {
      fontSize: 16,
      lineHeight: '26px'
    },
    body2: {
      fontSize: 14,
      lineHeight: '24px',
      letterSpacing: '0.4px'
    },
    subtitle1: {
      fontSize: 16,
      lineHeight: '26px'
    },
    subtitle2: {
      fontSize: 14,
      lineHeight: '23px'
    },
    h1: {
      fontWeight: 500,
      fontSize: 48,
      lineHeight: '40px'
    },
    h2: {
      fontWeight: 500,
      fontSize: 34,
      lineHeight: '40px'
    },
    h3: {
      fontWeight: 500,
      fontSize: 28,
      lineHeight: '34px'
    },
    h4: {
      fontWeight: 500,
      fontSize: 18,
      lineHeight: '27px'
    },
    h5: {
      fontSize: 16,
      lineHeight: '26px'
    }
  },
  palette: {
    primary: {
      light: '#e9e9e9',
      main: '#8d8d8d',
      dark: '#4a4a4a'
    },
    colors: {
      contentGray: '#D2D2D2',
      titleGray: '#555555',
      blue: '#2196f3',
      white: '#FFFFFF',
      purple: '#521C74',
      darkPurple: '#4d1a6d',
      gray: '#e7e7e7',
      inputGray: '#E0E0E0',
      black: '#333333',
      trueBlack: '#000000',
      zbayBlue: '#521c74',
      darkGray: '#7F7F7F',
      lushSky: '#67BFD3',
      lightGray: '#B2B2B2',
      veryLightGray: '#F0F0F0',
      green: '#4CBB17',
      greenDark: '#9BD174',
      red: '#FF0000',
      linkBlue: '#59c0d5',
      buttonGray: '#E3E3E3'
    }
  },
  overrides: {
    MuiSnackbarContent: {
      root: {
        wordBreak: 'break-all'
      }
    },
    MuiTab: {
      wrapper: {
        alignItems: 'flex-start'
      }
    },
    MuiButton: {
      sizeSmall: {
        textTransform: 'none',
        boxShadow: 'none',
        paddingLeft: '16px',
        paddingRight: '14px',
        fontWeight: 400,
        fontSize: '14px',
        '&:active': {
          boxShadow: 'none'
        }
      },
      sizeLarge: {
        textTransform: 'none',
        boxShadow: 'none',
        fontWeight: 400,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: 14,
        '&:active': {
          boxShadow: 'none'
        }
      }
    },
    MuiOutlinedInput: {
      input: {
        paddingTop: 20,
        paddingBottom: 20
      }
    },
    MuiPopover: {
      paper: {
        borderRadius: 8
      }
    }
  }
})
