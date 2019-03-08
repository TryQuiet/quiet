import { createMuiTheme } from '@material-ui/core/styles'

export default createMuiTheme({
  typography: {
    useNextVariants: true,
    caption: {
      color: '#b2b2b2',
      fontSize: '0.71rem'
    }
  },
  palette: {
    primary: {
      light: '#e9e9e9',
      main: '#8d8d8d',
      dark: '#4a4a4a'
    }
  },
  overrides: {
    MuiButton: {
      sizeSmall: {
        textTransform: 'none',
        boxShadow: 'none',
        paddingLeft: '16px',
        paddingRight: '14px',
        fontWeight: 400,
        fontSize: '14px'
      }
    }
  }
})
