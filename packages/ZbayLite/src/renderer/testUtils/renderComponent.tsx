import React, { FC, ReactElement } from 'react'
import { MuiThemeProvider } from '@material-ui/core'

import { render } from '@testing-library/react'

import theme from '../theme'

export const renderComponent = (ui: ReactElement): ReturnType<typeof render> => {
  const Wrapper: FC = ({ children }) => (
    <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
  )

  return render(ui, { wrapper: Wrapper })
}
