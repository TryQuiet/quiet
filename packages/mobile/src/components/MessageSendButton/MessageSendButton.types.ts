import { ViewStyle } from 'react-native';

export interface MessageSendButtonProps {
  onPress: () => void;
  disabled: Boolean;
  style?: ViewStyle;
}
