import React, { useCallback, useRef, forwardRef } from 'react'
import { TextInput, View } from 'react-native'
import { Typography } from '../Typography/Typography.component'

import { StyledTextInput, StyledWrapper } from './Input.styles'
import { InputProps } from './Input.types'
import { defaultTheme } from '../../styles/themes/default.theme'

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      onChangeText,
      label,
      placeholder,
      capitalize,
      validation,
      length,
      hint,
      multiline,
      disabled,
      style
    },
    ref
  ) => {
    const textInputRef = useRef<null | TextInput>(null)

    const handleViewPress = useCallback(() => {
      if (textInputRef.current) {
        textInputRef.current.focus()
      }
    }, [])

    return (
      <View>
        {label && (
          <Typography fontSize={14} style={{ paddingBottom: 10, color: defaultTheme.palette.typography.gray70 }}>
            {label}
          </Typography>
        )}
        <StyledWrapper
          onPress={handleViewPress}
          disabled={disabled}
          style={style}>
          <StyledTextInput
            onChangeText={onChangeText}
            ref={(instance: TextInput | null) => {
              textInputRef.current = instance
              if (ref !== null && 'current' in ref) {
                ref.current = instance
              }
            }}
            multiline={multiline}
            editable={!disabled}
            placeholder={placeholder}
            maxLength={length}
            autoCapitalize={capitalize}
            testID={'input'}
          />
        </StyledWrapper>
        {validation && (
          <Typography fontSize={10} color={'error'} style={{ paddingTop: 10 }}>
            {validation}
          </Typography>
        )}
        {hint && (
          <Typography fontSize={10} color={'hint'} style={{ paddingTop: 10 }}>
            {hint}
          </Typography>
        )}
      </View>
    )
  }
)
