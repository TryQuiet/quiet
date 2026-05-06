import {containerConst} from '../container.const';

export const template = `
import React from 'react'
import { Text, View } from 'react-native'

export const {{ ${containerConst.vars.name} }}Container: FC = () => {
  return (
    <View>
        <Text>{'{{ ${containerConst.vars.name} }}Container'}</Text>
    </View>
  )
}
`;
