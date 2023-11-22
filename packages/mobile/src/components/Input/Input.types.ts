import { ReactElement } from 'react'
import { ViewStyle } from 'react-native'

export interface InputProps {
    onChangeText?: (value: string) => void
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
}
