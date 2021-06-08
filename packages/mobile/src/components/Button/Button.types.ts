import { ViewStyle } from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}
