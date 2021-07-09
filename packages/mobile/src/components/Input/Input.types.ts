import { ViewStyle } from 'react-native';

export interface InputProps {
  onChangeText?: (value: string) => void;
  label?: string;
  placeholder: string;
  validation?: string;
  hint?: string;
  disabled?: boolean;
  style?: ViewStyle;
}
