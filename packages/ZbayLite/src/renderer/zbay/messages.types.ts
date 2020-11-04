import { MessageType } from "../../shared/static.types";
import BigNumber from "bignumber.js";

export interface IExchangeParticipant {
  replyTo: string;
  username: string;
  publicKey: string;
}
export interface IShippingData {}

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
  updateOnlyRegistered?: number;
}

/**
 * 
 export interface IModerationActionsType {
   REMOVE_MESSAGE: string;
   BLOCK_USER: string;
   UNBLOCK_USER: string;
   ADD_MOD: string;
   REMOVE_MOD: string;
   REMOVE_CHANNEL: string;
  }
  */
// export interface IDisplayableMessage {
//   id?: string;
//   type: MessageType;
//   sender: IExchangeParticipant;
//   receiver: IExchangeParticipant;
//   createdAt?: number;
//   message: IMessage;
//   spent: BigNumber;
//   fromYou: boolean;
//   status: string;
//   error?: any;
//   shippingData?: IShippingData;
//   tag: string;
//   offerOwner?: string;
//   isUnregistered: boolean;
//   publicKey?: string;
//   blockHeight: number;
// }

export interface IOutgoingMetadata {
  memo: string;
  memohex: string;
}

export class DisplayableMessage {
  id: string;
  keys: string[];
  owner: string;
  name: string;
  type: MessageType = MessageType.BASIC;
  sender: IExchangeParticipant;
  receiver: IExchangeParticipant;
  createdAt: number;
  message: IMessage;
  spent: BigNumber = new BigNumber(0);
  fromYou: boolean = false;
  status: string = "broadcasted";
  error?: any;
  shippingData?: IShippingData;
  tag: string;
  offerOwner?: string;
  isUnregistered: boolean;
  publicKey?: string;
  blockHeight: number = Number.MAX_SAFE_INTEGER;
  specialType: number;
  blockTime: number;
  messageId: string;
  nickname: string;
  address: string;
  outgoing_metadata: IOutgoingMetadata[];
  memohex: string;
  txid: string;
  amount: string;
  memo: string;
  datetime: string;
  block_height: string;

  constructor(values: Partial<DisplayableMessage>) {
    Object.assign(this, values);
  }
}
