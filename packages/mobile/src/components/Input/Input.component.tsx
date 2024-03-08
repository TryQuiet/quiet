import React, { useCallback, useRef, forwardRef, useState } from 'react'
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
      disabled = false,
      round = false,
      style,
      wrapperStyle,
      children,
    },
    ref
  ) => {
    const [height, setHeight] = useState(54)

    const textInputRef = useRef<null | TextInput>(null)

    const handleViewPress = useCallback(() => {
      if (textInputRef.current) {
        textInputRef.current.focus()
      }
    }, [])

    return (
      <View style={wrapperStyle}>
        {label && (
          <Typography fontSize={14} style={{ paddingBottom: 10, color: defaultTheme.palette.typography.gray70 }}>
            {label}
          </Typography>
        )}
        <StyledWrapper
          onPress={handleViewPress}
          disabled={disabled}
          round={round}
          style={{
            height: multiline ? Math.max(54, height + 20) : 54,
            ...style,
          }}
        >
          <StyledTextInput
            onChangeText={onChangeText}
            onContentSizeChange={event => {
              if (multiline) {
                setHeight(event.nativeEvent.contentSize.height)
              }
            }}
            ref={(instance: TextInput | null) => {
              textInputRef.current = instance
              if (ref !== null && 'current' in ref) {
                ref.current = instance
              }
            }}
            height={height}
            multiline={multiline}
            editable={!disabled}
            placeholder={placeholder}
            maxLength={length}
            autoCapitalize={capitalize}
            testID={'input'}
          />
          {children}
        </StyledWrapper>
        {validation && (
          <Typography fontSize={14} color={'error'} style={{ paddingTop: 10 }}>
            {validation}
          </Typography>
        )}
        {hint && (
          <Typography fontSize={14} color={'hint'} style={{ paddingTop: 10, lineHeight: 16 }}>
            {hint}
          </Typography>
        )}
      </View>
    )
  }
)
