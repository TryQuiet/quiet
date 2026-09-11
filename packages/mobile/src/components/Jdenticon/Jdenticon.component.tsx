import React from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import jdenticon from 'jdenticon'
import { SvgXml } from 'react-native-svg'
import { defaultTheme } from '../../styles/themes/default.theme'

const DEFAULT_JDENTICON_CONFIG: jdenticon.JdenticonConfig = {
  backColor: defaultTheme.palette.typography.white,
  padding: 0,
}

export const Jdenticon: React.FC<{
  value: string
  size: number
  borderRadius: number
  config?: jdenticon.JdenticonConfig
}> = props => {
  const jdenticonConfig = props.config ?? DEFAULT_JDENTICON_CONFIG
  const svg = jdenticon.toSvg(props.value, props.size, jdenticonConfig)
  const style: StyleProp<ViewStyle> = {
    width: props.size,
    height: props.size,
    borderRadius: props.borderRadius,
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <View style={style}>
      <SvgXml style={{ borderRadius: props.borderRadius, width: props.size, height: props.size }} xml={svg} />
    </View>
  )
}
