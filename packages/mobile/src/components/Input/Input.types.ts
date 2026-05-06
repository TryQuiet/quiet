import { ReactElement } from 'react'
import { ViewStyle } from 'react-native'

import { NativeSyntheticEvent, TextInputChangeEventData, TextInputEndEditingEventData } from 'react-native'
export interface InputProps {
  onChangeText?: (value: string) => void
  /** Called on native text change events (e.g., autocorrect commit) */
  onChange?: (e: NativeSyntheticEvent<TextInputChangeEventData>) => void
  /** Called when text input ends editing (e.g., on blur) */
  onEndEditing?: (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => void
  label?: string
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
}
