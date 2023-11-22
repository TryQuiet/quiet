import React, { FC, ReactElement } from 'react'
import { Provider } from 'react-redux'
import { Store } from 'redux'
import { store } from '../../store/store'
import { render } from '@testing-library/react-native'

interface Props {
    children?: React.ReactNode
}

export const renderComponent = (ui: ReactElement, state: Store = store): ReturnType<typeof render> => {
    const Wrapper: FC<Props> = ({ children }) => <Provider store={state}>{children}</Provider>

    return render(ui, { wrapper: Wrapper })
}
