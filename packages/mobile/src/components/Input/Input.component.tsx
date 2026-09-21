import React, { useCallback, useRef, forwardRef, useState } from 'react'
import { TextInput, View } from 'react-native'
import { Typography } from '../Typography/Typography.component'

import { COMPOSE_MIN_HEIGHT, INPUT_HEIGHT, StyledTextInput, StyledWrapper } from './Input.styles'
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
      autoCorrect = true,
      style,
      wrapperStyle,
      bottomSeparator,
      keyboardType = 'default',
      rightAccessory,
      leftAccessory,
      maxHeight,
      testID,
      children,
    },
    ref
  ) => {
    // Seed for the multiline measurement, not a design value — the chat composer grows from here.
    const [height, setHeight] = useState(COMPOSE_MIN_HEIGHT)
    const [focused, setFocused] = useState(false)

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
            <Typography fontSize={14} style={{ paddingBottom: 8, color: defaultTheme.palette.typography.gray70 }}>
              {label}
            </Typography>
          )}
          <StyledWrapper
            onPress={handleViewPress}
            disabled={disabled}
            focused={focused}
            invalid={validation != null && validation !== ''}
            style={{
              // A single-line field is the design library's 48. A growing one — only the chat
              // composer — keeps the taller floor it was written against.
              height: multiline
                ? Math.min(maxHeight ?? Number.MAX_SAFE_INTEGER, Math.max(COMPOSE_MIN_HEIGHT, height + 20))
                : INPUT_HEIGHT,
              ...style,
            }}
          >
            {leftAccessory}
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
              height={maxHeight != null && multiline ? Math.min(height, maxHeight - 14) : height}
              multiline={multiline}
              editable={!disabled}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholder}
              placeholderTextColor={defaultTheme.palette.typography.gray50}
              maxLength={length}
              autoCapitalize={capitalize}
              testID={'input'}
              autoCorrect={autoCorrect}
              keyboardType={keyboardType}
            >
              {children}
            </StyledTextInput>
            {rightAccessory}
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
