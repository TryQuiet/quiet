import React from 'react'
import { View } from 'react-native'
import jdenticon from 'jdenticon'
import { SvgXml } from 'react-native-svg'

export const Jdenticon: React.FC<{
  value: string
  size: number
  config?: jdenticon.JdenticonConfig
}> = props => {
  const svg = jdenticon.toSvg(props.value, props.size, props.config)
  const style = {
    width: props.size
  }

  return (
    <View style={style}>
      <SvgXml xml={svg} />
    </View>
  )
}
