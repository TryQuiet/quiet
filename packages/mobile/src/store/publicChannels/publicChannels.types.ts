export type IChannelInfo = {
  name: string;
  description: string;
  owner: string;
  timestamp: number;
  address: string;
  keys?: { ivk?: string; sk?: string };
};

export type IMessage = {
  id: string;
  type?: number;
  typeIndicator?: number;
  message: string;
  createdAt: number;
  r?: number;
  channelId: string;
  signature: string;
};

export type DisplayableMessage = {
  id: string;
  message: string;
  nickname: string;
  datetime: string;
};
