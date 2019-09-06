import { createMuiTheme } from '@material-ui/core/styles'

export default createMuiTheme({
  typography: {
    useNextVariants: true,
    caption: {
      color: '#b2b2b2',
      fontSize: '0.71rem'
    },
    subtitle1: {
      fontSize: '1.2rem'
    }
  },
  palette: {
    primary: {
      light: '#e9e9e9',
      main: '#8d8d8d',
      dark: '#4a4a4a'
    },
    colors: {
      blue: '#2196f3',
      white: '#FFFFFF',
      purple: '#521C74',
      gray: '#e7e7e7',
      black: '#333333'
    }
  },
  overrides: {
    MuiSnackbarContent: {
      root: {
        wordBreak: 'break-all'
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
        paddingTop: 14.5,
        paddingBottom: 14.5
      }
    }
  }
})
