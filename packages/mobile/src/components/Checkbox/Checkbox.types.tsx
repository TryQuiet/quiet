import React from 'react'
import { CheckboxProps as RNPCheckboxProps } from 'react-native-paper'

export interface CheckboxProps extends RNPCheckboxProps {
  label?: string | React.JSX.Element
}
