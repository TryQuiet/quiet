import { ViewStyle } from 'react-native'

export interface MessageSendButtonProps {
    onPress: () => void
    disabled: boolean
    style?: ViewStyle
}
