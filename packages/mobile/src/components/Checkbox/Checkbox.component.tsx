import React from 'react'
import { Checkbox as RNPCheckbox } from 'react-native-paper'

import { CheckboxProps } from './Checkbox.types'
import { View } from 'react-native'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'

export const Checkbox: React.FC<CheckboxProps> = ({ label, disabled, status, onPress, testID }: CheckboxProps) => {
  const checkedColor = disabled ? defaultTheme.palette.typography.gray50 : defaultTheme.palette.typography.darkPurple
  const uncheckedColor = disabled ? defaultTheme.palette.typography.gray50 : defaultTheme.palette.typography.darkPurple
  const labelColor = disabled ? defaultTheme.palette.typography.gray50 : defaultTheme.palette.typography.main
  return (
    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 16 }}>
      <RNPCheckbox.Android
        testID={testID}
        status={status}
        disabled={disabled}
        onPress={onPress}
        color={checkedColor}
        uncheckedColor={uncheckedColor}
      />
      {label &&
        (typeof label === 'string' ? (
          <Typography fontSize={16} fontWeight={'medium'} style={{ color: labelColor }}>
            {label}
          </Typography>
        ) : (
          label
        ))}
    </View>
  )
}
