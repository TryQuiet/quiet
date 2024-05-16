import { render, RenderAPI } from '@testing-library/react-native'
import React, { FC, ReactElement } from 'react'
import { ThemeProvider } from 'styled-components/native'

import { defaultTheme } from '../../../styles/themes/default.theme'
import { RenderComponentProps } from './renderComponent.types'

export const renderComponent = (ui: ReactElement): RenderAPI => {
  const Wrapper: FC<RenderComponentProps> = ({ children }) => (
    <ThemeProvider theme={defaultTheme}>{children}</ThemeProvider>
  )

  return render(ui, { wrapper: Wrapper })
}
