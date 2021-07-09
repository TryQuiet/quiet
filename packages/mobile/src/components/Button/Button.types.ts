import { ViewStyle } from 'react-native';

export interface ButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  style?: ViewStyle;
}
