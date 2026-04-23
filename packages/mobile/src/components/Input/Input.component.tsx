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
      onChange,
      onEndEditing,
      value,
      label,
      subtitle,
      placeholder,
      capitalize,
      validation,
      length,
      hint,
      multiline,
      disabled = false,
      round = false,
      autoCorrect = true,
      style,
      wrapperStyle,
      bottomSeparator,
      keyboardType = 'default',
      testID,
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
      <View testID={testID}>
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
              value={value}
              onChangeText={onChangeText}
              onChange={onChange}
              onEndEditing={onEndEditing}
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
              placeholderTextColor={defaultTheme.palette.typography.grayDark}
              maxLength={length}
              autoCapitalize={capitalize}
              testID={'input'}
              autoCorrect={autoCorrect}
              keyboardType={keyboardType}
            >
              {children}
            </StyledTextInput>
          </StyledWrapper>
          {subtitle && (
            <Typography
              fontSize={12}
              style={{
                paddingTop: 6,
                paddingHorizontal: 8,
                lineHeight: 16,
                color: defaultTheme.palette.typography.grayDark,
                fontWeight: 400,
              }}
            >
              {subtitle}
            </Typography>
          )}
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
        {bottomSeparator && <View style={{ paddingTop: 16 }}>{bottomSeparator}</View>}
      </View>
    )
  }
)
