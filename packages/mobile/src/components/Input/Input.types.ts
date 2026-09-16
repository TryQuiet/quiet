import { ReactElement } from 'react'
import { KeyboardTypeOptions, ViewStyle } from 'react-native'

import { NativeSyntheticEvent, TextInputChangeEventData, TextInputEndEditingEventData } from 'react-native'
export interface InputProps {
  onChangeText?: (value: string) => void
  /** Called on native text change events (e.g., autocorrect commit) */
  onChange?: (e: NativeSyntheticEvent<TextInputChangeEventData>) => void
  /** Called when text input ends editing (e.g., on blur) */
  onEndEditing?: (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => void
  label?: string
  subtitle?: string
  placeholder: string
  capitalize?: 'none' | 'sentences' | 'words' | 'characters'
  validation?: string
  length?: number
  hint?: string
  multiline?: boolean
  disabled?: boolean
  round?: boolean
  style?: ViewStyle
  wrapperStyle?: ViewStyle
  children?: ReactElement
  autoCorrect?: boolean
  /** Controlled text value */
  value?: string
  bottomSeparator?: React.ReactElement
  keyboardType?: KeyboardTypeOptions
  /** Rendered inside the field, after the text — e.g. a clear button. */
  rightAccessory?: React.ReactNode
  /** Rendered inside the field, before the text — e.g. a "To:" prefix. */
  leftAccessory?: React.ReactNode
  /** Cap for a multiline field; past this the text scrolls instead of growing. */
  maxHeight?: number
  testID?: string
}
