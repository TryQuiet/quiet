import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import React from 'react';

const Stack = createStackNavigator();

export const withNavigation = story => {
  const Screen = () => story();

  return (
    <NavigationContainer independent>
      <Stack.Navigator>
        <Stack.Screen
          component={Screen}
          name={'MyStorybookScreen'}
          options={{header: () => null}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
