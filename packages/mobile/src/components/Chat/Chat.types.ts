import {
  DisplayableMessage,
  IChannelInfo,
} from '../../store/publicChannels/publicChannels.types';

export interface ChatProps {
  sendMessageAction: (message: string) => void;
  channel: IChannelInfo;
  messages: DisplayableMessage[];
  user: string;
}
