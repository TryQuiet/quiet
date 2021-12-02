export type PublicChannel = {
  name: string;
  description: string;
  owner: string;
  timestamp: number;
  address: string;
};

export type ChannelMessage = {
  id: string;
  type: number;
  message: string;
  createdAt: number;
  channelId: string;
  signature: string;
  pubKey: string;
};

export type DisplayableMessage = {
  id: string;
  type: number;
  message: string;
  createdAt: number; // seconds
  date: string; // displayable
  nickname: string;
};

export type MessagesGroupedByDay = Array<{
  day: string;
  messages: DisplayableMessage[];
}>;
