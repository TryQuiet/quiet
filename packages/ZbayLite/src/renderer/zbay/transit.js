import { inflate, deflate } from '../compression'
import { moderationActionsType, messageType } from '../../shared/static'

const currentNetwork = parseInt(process.env.ZBAY_IS_TESTNET) ? 2 : 1

export const MEMO_SIZE = 512
const MEMO_FORMAT_FLAG_SIZE = 1
const MEMO_FORMAT_FLAG_VALUE = 255 // 0xFF
const TYPE_SIZE = 1
const SIGNATURE_SIZE = 64
const SIGNATURE_R_SIZE = 1
const TIMESTAMP_SIZE = 4
const LINKED_ITEM_SIZE = 64
const PUBLIC_KEY_SIZE = 66
const TXID_SIZE = 64

export const MESSAGE_SIZE =
  MEMO_SIZE -
  (TIMESTAMP_SIZE +
    SIGNATURE_SIZE +
    SIGNATURE_R_SIZE +
    TYPE_SIZE +
    MEMO_FORMAT_FLAG_SIZE)

export const MESSAGE_ITEM_SIZE = MESSAGE_SIZE - LINKED_ITEM_SIZE

export const ADDRESS_TYPE = {
  SHIELDED_MAINNET: 1,
  SHIELDED_TESTNET: 2
}
// TYPE USER
const FIRST_NAME_SIZE = 20
const LAST_NAME_SIZE = 20
const NICKNAME_SIZE = 20
const ADDRESS_TYPE_SIZE = 1
const SHIELDED_MAINNET_SIZE = 78
const SHIELDED_TESTNET_SIZE = 88
// TYPE PUBLISH_CHANNEL
const PUBLISH_CHANNEL_NETWORK_TYPE_SIZE = 1
export const PUBLISH_CHANNEL_NAME_SIZE = 20
const PUBLISH_CHANNEL_IVK_MAINNET_SIZE = 285
const PUBLISH_CHANNEL_IVK_TESTNET_SIZE = 295

// TYPE MODERATION
const MODERATION_TYPE_SIZE = 20
const TARGET_SIZE_FLAG = 1
// TYPE CHANNEL_SETTINGS
const OWNER_SIZE = 66
const MIN_FEE_SIZE = 4
const ONLY_FOR_REGISTERED_SIZE = 1
// TYPE AD
export const TAG_SIZE = 9
const BACKGROUND_SIZE = 2
export const TITLE_SIZE = 30
const PROVIDE_SHIPPING_SIZE = 1
const AMOUNT_SIZE = 8
const DESCRIPTION_SIZE =
  MESSAGE_SIZE -
  TAG_SIZE -
  BACKGROUND_SIZE -
  TITLE_SIZE -
  PROVIDE_SHIPPING_SIZE -
  AMOUNT_SIZE

const addressSizeToType = {
  [SHIELDED_MAINNET_SIZE]: ADDRESS_TYPE.SHIELDED_MAINNET,
  [SHIELDED_TESTNET_SIZE]: ADDRESS_TYPE.SHIELDED_TESTNET
}
const typeToAddressSize = {
  [ADDRESS_TYPE.SHIELDED_MAINNET]: SHIELDED_MAINNET_SIZE,
  [ADDRESS_TYPE.SHIELDED_TESTNET]: SHIELDED_TESTNET_SIZE
}
// const ivkSizeToType = {
//   [PUBLISH_CHANNEL_IVK_MAINNET_SIZE]: ADDRESS_TYPE.SHIELDED_MAINNET,
//   [PUBLISH_CHANNEL_IVK_TESTNET_SIZE]: ADDRESS_TYPE.SHIELDED_TESTNET
// }
const typeToIvkSize = {
  [ADDRESS_TYPE.SHIELDED_MAINNET]: PUBLISH_CHANNEL_IVK_MAINNET_SIZE,
  [ADDRESS_TYPE.SHIELDED_TESTNET]: PUBLISH_CHANNEL_IVK_TESTNET_SIZE
}
export const CHANNEL_DESCRIPTION_SIZE = networkType =>
  MESSAGE_SIZE -
  (PUBLISH_CHANNEL_NETWORK_TYPE_SIZE +
    PUBLISH_CHANNEL_NAME_SIZE +
    typeToAddressSize[networkType] +
    typeToIvkSize[networkType])

export const UPDATE_DESCRIPTION_SIZE =
  MESSAGE_SIZE -
  MIN_FEE_SIZE +
  ONLY_FOR_REGISTERED_SIZE +
  typeToAddressSize[currentNetwork]

const moderationTypeToSize = {
  [moderationActionsType.ADD_MOD]: PUBLIC_KEY_SIZE,
  [moderationActionsType.BLOCK_USER]: PUBLIC_KEY_SIZE,
  [moderationActionsType.REMOVE_MOD]: PUBLIC_KEY_SIZE,
  [moderationActionsType.UNBLOCK_USER]: PUBLIC_KEY_SIZE,
  [moderationActionsType.REMOVE_CHANNEL]: TXID_SIZE,
  [moderationActionsType.REMOVE_MESSAGE]: TXID_SIZE
}

export const createStandardMemo = async message => {
  const allocatedMessage = Buffer.alloc(MEMO_SIZE)
  allocatedMessage.write(message)
  return allocatedMessage.toString('hex')
}

export const packMemo = async message => {
  const formatFlag = Buffer.alloc(MEMO_FORMAT_FLAG_SIZE)
  formatFlag.writeUInt8(MEMO_FORMAT_FLAG_VALUE)
  const type = Buffer.alloc(TYPE_SIZE)
  type.writeUInt8(message.type)
  const signatureData = message.signature
  const r = Buffer.alloc(SIGNATURE_R_SIZE)
  r.writeUInt8(message.r)
  const ts = Buffer.alloc(TIMESTAMP_SIZE)
  ts.writeUInt32BE(message.createdAt)

  let msgData
  switch (message.type) {
    case messageType.USER:
      const firstName = Buffer.alloc(FIRST_NAME_SIZE)
      firstName.write(message.message.firstName)
      const lastName = Buffer.alloc(LAST_NAME_SIZE)
      lastName.write(message.message.lastName)
      const nickname = Buffer.alloc(NICKNAME_SIZE)
      nickname.write(message.message.nickname)
      const addressType = Buffer.alloc(ADDRESS_TYPE_SIZE)
      const type = addressSizeToType[message.message.address.length]
      addressType.writeUInt8(type)
      const address = Buffer.alloc(typeToAddressSize[type])
      address.write(message.message.address)
      msgData = Buffer.concat(
        [firstName, lastName, nickname, addressType, address],
        MESSAGE_SIZE
      )
      break
    case messageType.AD:
      const tag = Buffer.alloc(TAG_SIZE)
      tag.write(message.message.tag)
      const background = Buffer.alloc(BACKGROUND_SIZE)
      background.writeUInt16BE(message.message.background)
      const title = Buffer.alloc(TITLE_SIZE)
      title.write(message.message.title)
      const provideShipping = Buffer.alloc(PROVIDE_SHIPPING_SIZE)
      provideShipping.writeUInt8(message.message.provideShipping)
      const amount = Buffer.alloc(AMOUNT_SIZE)
      amount.writeDoubleBE(message.message.amount)
      const description = Buffer.alloc(DESCRIPTION_SIZE)
      description.write(message.message.description)
      msgData = Buffer.concat(
        [tag, background, title, provideShipping, amount, description],
        MESSAGE_SIZE
      )
      break
    case messageType.ITEM_BASIC || messageType.ITEM_TRANSFER:
      const item = Buffer.alloc(LINKED_ITEM_SIZE)
      item.write(message.message.itemId)
      const msg = Buffer.alloc(MESSAGE_ITEM_SIZE)
      msg.write(message.message.text)
      msgData = Buffer.concat([item, msg])
      break
    case messageType.CHANNEL_SETTINGS:
      const owner = Buffer.alloc(OWNER_SIZE)
      owner.write(message.message.owner)
      const minFee = Buffer.alloc(MIN_FEE_SIZE)
      minFee.writeUInt32BE(message.message.minFee * 100000000)
      const onlyRegistered = Buffer.alloc(ONLY_FOR_REGISTERED_SIZE)
      onlyRegistered.writeUInt8(message.message.onlyRegistered)
      msgData = Buffer.concat([owner, minFee, onlyRegistered], MESSAGE_SIZE)
      break
    case messageType.CHANNEL_SETTINGS_UPDATE:
      const updateChannelAddress = Buffer.alloc(
        typeToAddressSize[currentNetwork]
      )
      updateChannelAddress.write(message.message.updateChannelAddress)
      const updateMinFee = Buffer.alloc(MIN_FEE_SIZE)
      updateMinFee.writeUInt32BE(message.message.updateMinFee * 100000000)
      const updateOnlyRegistered = Buffer.alloc(ONLY_FOR_REGISTERED_SIZE)
      updateOnlyRegistered.writeUInt8(message.message.updateOnlyRegistered)
      const updateChannelDescription = Buffer.alloc(UPDATE_DESCRIPTION_SIZE)
      updateChannelDescription.write(message.message.updateChannelDescription)
      msgData = Buffer.concat(
        [
          updateChannelAddress,
          updateMinFee,
          updateOnlyRegistered,
          updateChannelDescription
        ],
        MESSAGE_SIZE
      )
      break
    case messageType.MODERATION:
      const moderationType = Buffer.alloc(MODERATION_TYPE_SIZE)
      moderationType.write(message.message.moderationType)
      const targetSize = Buffer.alloc(TARGET_SIZE_FLAG)
      targetSize.writeUInt8(
        moderationTypeToSize[message.message.moderationType]
      )
      const moderationTarget = Buffer.alloc(
        moderationTypeToSize[message.message.moderationType]
      )
      moderationTarget.write(message.message.moderationTarget)
      msgData = Buffer.concat(
        [moderationType, targetSize, moderationTarget],
        MESSAGE_SIZE
      )
      break
    case messageType.PUBLISH_CHANNEL:
      const networkType = Buffer.alloc(PUBLISH_CHANNEL_NETWORK_TYPE_SIZE)
      networkType.writeUInt8(message.message.networkType)
      const channelName = Buffer.alloc(PUBLISH_CHANNEL_NAME_SIZE)
      channelName.write(message.message.channelName)
      const channelAddress = Buffer.alloc(
        typeToAddressSize[message.message.networkType]
      )
      channelAddress.write(message.message.channelAddress)
      const channelIvk = Buffer.alloc(
        typeToIvkSize[message.message.networkType]
      )
      channelIvk.write(message.message.channelIvk)
      const channelDescription = Buffer.alloc(
        CHANNEL_DESCRIPTION_SIZE(message.message.networkType)
      )

      channelDescription.write(message.message.channelDescription)
      msgData = Buffer.concat(
        [
          networkType,
          channelName,
          channelAddress,
          channelIvk,
          channelDescription
        ],
        MESSAGE_SIZE
      )
      break
    default:
      msgData = Buffer.alloc(MESSAGE_SIZE)
      const d = await deflate(message.message)
      msgData.write(d)
      break
  }

  const result = Buffer.concat([
    formatFlag,
    type,
    signatureData,
    r,
    ts,
    msgData
  ])
  return result.toString('hex')
}

export const unpackMemo = async memo => {
  const memoBuff = Buffer.from(memo, 'hex')
  const formatFlagEnds = MEMO_FORMAT_FLAG_SIZE
  const formatFlag = memoBuff.slice(0, formatFlagEnds).readUInt8()
  if (formatFlag !== MEMO_FORMAT_FLAG_VALUE) {
    return null
  }
  const typeEnds = TYPE_SIZE + MEMO_FORMAT_FLAG_SIZE
  const type = memoBuff.slice(formatFlagEnds, typeEnds).readUInt8()

  const signatureEnds = typeEnds + SIGNATURE_SIZE
  const signature = memoBuff.slice(typeEnds, signatureEnds)
  const rEnds = signatureEnds + SIGNATURE_R_SIZE
  const r = memoBuff.slice(signatureEnds, rEnds).readUInt8()

  const timestampEnds = rEnds + TIMESTAMP_SIZE
  const createdAt = memoBuff.slice(rEnds, timestampEnds).readUInt32BE()

  switch (type) {
    case messageType.USER:
      const firstNameEnds = timestampEnds + FIRST_NAME_SIZE
      const firstName = memoBuff.slice(timestampEnds, firstNameEnds)

      const lastNameEnds = firstNameEnds + LAST_NAME_SIZE
      const lastName = memoBuff.slice(firstNameEnds, lastNameEnds)

      const nicknameEnds = lastNameEnds + NICKNAME_SIZE
      const nickname = memoBuff.slice(lastNameEnds, nicknameEnds)

      const addressTypeEnds = nicknameEnds + ADDRESS_TYPE_SIZE
      const addressType = memoBuff
        .slice(nicknameEnds, addressTypeEnds)
        .readUInt8()

      const addressEnds = addressTypeEnds + typeToAddressSize[addressType]
      const address = memoBuff.slice(addressTypeEnds, addressEnds)
      return {
        type,
        signature,
        r,
        message: {
          firstName: trimNull(firstName.toString()),
          lastName: trimNull(lastName.toString()),
          nickname: trimNull(nickname.toString()),
          address: address.toString()
        },
        createdAt
      }
    case messageType.AD:
      const tagEnds = timestampEnds + TAG_SIZE
      const tag = memoBuff.slice(timestampEnds, tagEnds)

      const backgroundEnds = tagEnds + BACKGROUND_SIZE
      const background = memoBuff.slice(tagEnds, backgroundEnds).readUInt16BE()

      const titleEnds = backgroundEnds + TITLE_SIZE
      const title = memoBuff.slice(backgroundEnds, titleEnds)

      const provideShippingEnds = titleEnds + PROVIDE_SHIPPING_SIZE
      const provideShipping = memoBuff
        .slice(titleEnds, provideShippingEnds)
        .readUInt8()

      const amountEnds = provideShippingEnds + AMOUNT_SIZE
      const amount = memoBuff
        .slice(provideShippingEnds, amountEnds)
        .readDoubleBE()

      const descriptionEnds = amountEnds + DESCRIPTION_SIZE
      const description = memoBuff.slice(amountEnds, descriptionEnds)
      return {
        type,
        signature,
        r,
        message: {
          tag: trimNull(tag.toString()),
          background: trimNull(background.toString()),
          title: trimNull(title.toString()),
          provideShipping: trimNull(provideShipping.toString()),
          amount: trimNull(amount.toString()),
          description: trimNull(description.toString())
        },
        createdAt
      }
    case messageType.ITEM_BASIC || messageType.ITEM_TRANSFER:
      const itemEnds = timestampEnds + LINKED_ITEM_SIZE
      const item = memoBuff.slice(timestampEnds, itemEnds)
      const msgEnds = itemEnds + MESSAGE_ITEM_SIZE
      const msg = memoBuff.slice(itemEnds, msgEnds)
      return {
        type,
        signature,
        r,
        message: {
          itemId: trimNull(item.toString()),
          text: trimNull(msg.toString())
        },
        createdAt
      }
    case messageType.CHANNEL_SETTINGS:
      const ownerEnds = timestampEnds + OWNER_SIZE
      const owner = memoBuff.slice(timestampEnds, ownerEnds)
      const minFeeEnds = ownerEnds + MIN_FEE_SIZE
      const minFee = memoBuff.slice(ownerEnds, minFeeEnds).readUInt32BE()
      const onlyRegisteredEnds = minFeeEnds + ONLY_FOR_REGISTERED_SIZE
      const onlyRegistered = memoBuff
        .slice(minFeeEnds, onlyRegisteredEnds)
        .readUInt8()

      return {
        type,
        signature,
        r,
        message: {
          owner: trimNull(owner.toString()),
          minFee: trimNull((minFee / 100000000).toString()),
          onlyRegistered: trimNull(onlyRegistered.toString())
        },
        createdAt
      }
    case messageType.CHANNEL_SETTINGS_UPDATE:
      const updateChannelAddressEnds =
        timestampEnds + typeToAddressSize[currentNetwork]
      const updateChannelAddress = memoBuff.slice(
        timestampEnds,
        updateChannelAddressEnds
      )
      const updateMinFeeEnds = updateChannelAddressEnds + MIN_FEE_SIZE
      const updateMinFee = memoBuff
        .slice(updateChannelAddressEnds, updateMinFeeEnds)
        .readUInt32BE()
      const updateOnlyRegisteredEnds =
        updateMinFeeEnds + ONLY_FOR_REGISTERED_SIZE
      const updateOnlyRegistered = memoBuff
        .slice(updateMinFeeEnds, updateOnlyRegisteredEnds)
        .readUInt8()
      const updateChannelDescriptionEnds =
        updateOnlyRegisteredEnds + UPDATE_DESCRIPTION_SIZE
      const updateChannelDescription = memoBuff.slice(
        updateOnlyRegisteredEnds,
        updateChannelDescriptionEnds
      )
      return {
        type,
        signature,
        r,
        message: {
          updateChannelDescription: trimNull(
            updateChannelDescription.toString()
          ),
          updateChannelAddress: trimNull(updateChannelAddress.toString()),
          updateMinFee: trimNull((updateMinFee / 100000000).toString()),
          updateOnlyRegistered: trimNull(updateOnlyRegistered.toString())
        },
        createdAt
      }
    case messageType.MODERATION:
      const moderationTypeEnds = timestampEnds + MODERATION_TYPE_SIZE
      const moderationType = memoBuff.slice(timestampEnds, moderationTypeEnds)
      const targetSizeFlagEnds = moderationTypeEnds + TARGET_SIZE_FLAG
      const targetSizeFlag = memoBuff
        .slice(moderationTypeEnds, targetSizeFlagEnds)
        .readUInt8()
      const moderationTargetEnds = targetSizeFlagEnds + targetSizeFlag
      const moderationTarget = memoBuff.slice(
        targetSizeFlagEnds,
        moderationTargetEnds
      )

      return {
        type,
        signature,
        r,
        message: {
          moderationType: trimNull(moderationType.toString()),
          moderationTarget: trimNull(moderationTarget.toString())
        },
        createdAt
      }
    case messageType.PUBLISH_CHANNEL:
      const networkTypeEnds = timestampEnds + PUBLISH_CHANNEL_NETWORK_TYPE_SIZE
      const networkType = memoBuff
        .slice(timestampEnds, networkTypeEnds)
        .readUInt8()
      const channelNameEnds = networkTypeEnds + PUBLISH_CHANNEL_NAME_SIZE
      const channelName = memoBuff.slice(networkTypeEnds, channelNameEnds)
      const channelAddressEnds =
        channelNameEnds + typeToAddressSize[networkType]
      const channelAddress = memoBuff.slice(channelNameEnds, channelAddressEnds)
      const channelIvkEnds = channelAddressEnds + typeToIvkSize[networkType]
      const channelIvk = memoBuff.slice(channelAddressEnds, channelIvkEnds)
      const channelDescriptionEnds =
        channelIvkEnds + CHANNEL_DESCRIPTION_SIZE(networkType)
      const channelDescription = memoBuff.slice(
        channelIvkEnds,
        channelDescriptionEnds
      )
      return {
        type,
        signature,
        r,
        message: {
          channelName: trimNull(channelName.toString()),
          channelAddress: trimNull(channelAddress.toString()),
          channelIvk: trimNull(channelIvk.toString()),
          channelDescription: trimNull(channelDescription.toString()),
          networkType: parseInt(trimNull(networkType.toString()))
        },
        createdAt
      }
    default:
      const message = memoBuff.slice(timestampEnds)
      return {
        type,
        signature,
        r,
        message: await inflate(message.toString()),
        createdAt
      }
  }
}

export const trimNull = a => {
  var c = a.indexOf('\0')
  if (c > -1) {
    return a.substr(0, c)
  }
  return a
}
