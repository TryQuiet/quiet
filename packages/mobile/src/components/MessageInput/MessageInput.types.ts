import { ViewStyle } from 'react-native';

export interface MessageInputProps {
  onChangeText: (value: string) => void;
  placeholder: string;
  style?: ViewStyle;
}
