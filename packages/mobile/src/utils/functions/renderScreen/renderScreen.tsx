import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {render, RenderAPI} from '@testing-library/react-native';
import React from 'react';
import {Provider} from 'react-redux';
import {ThemeProvider} from 'styled-components/native';

import {store} from '../../../store/store';
import {defaultTheme} from '../../../styles/themes/default.theme';

const {Navigator, Screen} = createStackNavigator();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const renderScreen = (PassedScreen: React.FC<any>): RenderAPI => {
  const RenderedScreen: React.FC = () => (
    <Provider store={store}>
      <ThemeProvider theme={defaultTheme}>
        <NavigationContainer>
          <Navigator headerMode={'none'}>
            <Screen component={PassedScreen} name={PassedScreen.name} />
          </Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </Provider>
  );

  return render(<RenderedScreen />);
};
