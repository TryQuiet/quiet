export const networkFee = 0.0000025
export const DOMAIN = 'handlers.zbay.app'
export const LOG_ENDPOINT = 'https://handlers.zbay.app/email'
export const REQUEST_MONEY_ENDPOINT = ' https://u1uxu6p870.execute-api.us-east-1.amazonaws.com/Prod/requestMoney'

export const messageType = {
  BASIC: 1,
  AD: 2,
  TRANSFER: 4,
  USER: 5,
  CHANNEL_SETTINGS: 6,
  MODERATION: 7,
  PUBLISH_CHANNEL: 8,
  ITEM_BASIC: 11,
  ITEM_TRANSFER: 41,
  AFFILIATE: 170 // 'aa' in hex
}

export const moderationActionsType = {
  REMOVE_MESSAGE: 'REMOVE_MESSAGE',
  BLOCK_USER: 'BLOCK_USER',
  UNBLOCK_USER: 'UNBLOCK_USER',
  ADD_MOD: 'ADD_MOD',
  REMOVE_MOD: 'REMOVE_MOD',
  REMOVE_CHANNEL: 'REMOVE_CHANNEL'
}
