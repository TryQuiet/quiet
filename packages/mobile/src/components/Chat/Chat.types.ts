import {
  DisplayableMessage,
  IChannelInfo,
} from '../../store/publicChannels/publicChannels.types';

export interface ChatProps {
  sendMessageAction: () => void;
  channel: IChannelInfo;
  messages: DisplayableMessage[];
  user: string;
}
