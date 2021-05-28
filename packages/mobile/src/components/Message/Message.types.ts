import {ViewStyle} from 'react-native';
import {IMessage} from '../../store/publicChannels/publicChannels.types';

export interface DisplayableMessageProps {
  messageStyle?: ViewStyle;
  message: IMessage;
  nickname: string;
  datetime: string;
}
