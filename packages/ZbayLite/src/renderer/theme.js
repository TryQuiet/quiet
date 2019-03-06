import { createMuiTheme } from '@material-ui/core/styles'

export default createMuiTheme({
  typography: {
    useNextVariants: true
  },
  palette: {
    primary: {
      light: '#e9e9e9',
      main: '#8d8d8d',
      dark: '#4a4a4a'
    }
  }
})
