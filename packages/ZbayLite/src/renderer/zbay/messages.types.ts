import { MessageType } from "../../shared/static.types";
import BigNumber from "bignumber.js";

export interface IShippingData { }
export interface IOutgoingMetadata {
  memo: string;
  memohex: string;
}
export interface IExchangeParticipant {
  replyTo: string;
  username: string;
  publicKey?: string;
  address?: string;
  nickname?: string;
}
export class ExchangeParticipant {
  replyTo: string ='';
  username: string = "Unnamed";
  publicKey: string='';
  address: string='';
  nickname: string='';
  
  constructor(
    values?: Partial<ExchangeParticipant>
  ) {
    Object.assign(this, values);
  }
}
export interface IMessage {
  moderationType: string;
  moderationTarget: string;
  owner: string;
  itemId: string;
  text: string;
  tag: string;
  offerOwner: string;
  minFee?: string;
  updateMinFee?: string;
  updateChannelDescription?: string;
  updateChannelAddress?: string;
  updateOnlyRegistered?: number;
  channelAddress?: string
  channelName?:string;
  channelDescription?: string;
  channelIvk?: string;
}
export class DisplayableMessage {
  id: string
  keys: string[]
  owner: string
  name: string
  type: MessageType = MessageType.BASIC
  sender: IExchangeParticipant
  receiver: IExchangeParticipant
  createdAt: number
  message: IMessage
  spent: BigNumber = new BigNumber(0)
  fromYou: boolean = false
  status: string = 'broadcasted'
  error?: string
  shippingData?: IShippingData
  tag: string
  offerOwner?: string
  isUnregistered: boolean
  publicKey?: string
  blockHeight: number = Number.MAX_SAFE_INTEGER
  block_height: string
  specialType: number
  blockTime: number
  messageId: string
  nickname: string
  address: string
  outgoing_metadata: IOutgoingMetadata[]
  memohex: string
  txid: string
  amount: string
  memo: string
  datetime: string

  constructor(
    values: Partial<DisplayableMessage> &
      Pick<
        DisplayableMessage,
        | 'id'
        | 'keys'
        | 'owner'
        | 'name'
        | 'sender'
        | 'receiver'
        | 'createdAt'
        | 'message'
        | 'tag'
        | 'isUnregistered'
        | 'specialType'
        | 'blockTime'
        | 'block_height'
        | 'messageId'
        | 'nickname'
        | 'address'
        | 'outgoing_metadata'
        | 'memohex'
        | 'txid'
        | 'amount'
        | 'memo'
        | 'datetime'
      >
  ) {
    Object.assign(this, values)
  }
}
