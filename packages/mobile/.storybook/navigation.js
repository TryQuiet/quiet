import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator()

export const withNavigation = story => {
  const Screen = () => story()

  return (
    <NavigationContainer independent>
      <Stack.Navigator>
        <Stack.Screen
          component={Screen}
          name={'MyStorybookScreen'}
          options={{ header: () => null }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
