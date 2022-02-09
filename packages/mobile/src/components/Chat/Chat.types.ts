import {
  DisplayableMessage,
  PublicChannel,
} from '@quiet/nectar';

export interface ChatProps {
  sendMessageAction: (message: string) => void;
  channel: PublicChannel;
  messages: DisplayableMessage[];
  user: string;
}
