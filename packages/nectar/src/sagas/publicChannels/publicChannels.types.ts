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
  createdAt: string;
  nickname: string;
};
