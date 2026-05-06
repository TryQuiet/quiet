import {screenConst} from '../screen.const';

export const template = `
import React, { FC } from 'react'
import { Text, View } from 'react-native'

export const {{ ${screenConst.vars.name} }}Screen: FC = () => {
  return (
    <View>
        <Text>{'{{ ${screenConst.vars.name} }}Screen'}</Text>
    </View>
  )
}
`;
