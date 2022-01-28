import React, { FC, ReactElement } from 'react'
import { MuiThemeProvider } from '@material-ui/core'
import { Provider } from 'react-redux'

import { render } from '@testing-library/react'

import theme from '../theme'
import store from '../store'
import { Store } from 'redux'

export const renderComponent = (ui: ReactElement, storeState: Store = store): ReturnType<typeof render> => {
  const Wrapper: FC = ({ children }) => (
    <MuiThemeProvider theme={theme}>
      <Provider store={storeState}>
        {children}
      </Provider>
    </MuiThemeProvider>
  )

  return render(ui, { wrapper: Wrapper })
}
