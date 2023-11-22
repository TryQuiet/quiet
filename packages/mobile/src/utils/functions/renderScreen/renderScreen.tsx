import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { render, RenderAPI } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { ThemeProvider } from 'styled-components/native'

import { store } from '../../../store/store'
import { defaultTheme } from '../../../styles/themes/default.theme'

const { Navigator, Screen } = createNativeStackNavigator()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const renderScreen = (PassedScreen: React.FC<any>): RenderAPI => {
    const RenderedScreen: React.FC = () => (
        <Provider store={store}>
            <ThemeProvider theme={defaultTheme}>
                <NavigationContainer>
                    <Navigator>
                        <Screen component={PassedScreen} name={PassedScreen.name} />
                    </Navigator>
                </NavigationContainer>
            </ThemeProvider>
        </Provider>
    )

    return render(<RenderedScreen />)
}
