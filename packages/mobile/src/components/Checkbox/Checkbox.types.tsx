import React from 'react'
import { CheckboxProps as RNPCheckboxProps } from 'react-native-paper'
import { ViewStyle } from 'react-native/types'

export interface CheckboxProps extends RNPCheckboxProps {
  label?: string | React.JSX.Element
  viewStyle?: ViewStyle
}
