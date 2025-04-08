import { DisplayableMessage } from '@quiet/types'
import { DateTime } from 'luxon'

const OCT_28_2023 = 1698451200 // Unix timestamp for Oct 28, 2023 00:00:00 UTC
const OCT_27_2023 = OCT_28_2023 - 86400 // Previous day
const OCT_26_2023 = OCT_27_2023 - 86400 // Two days before

export const users = {
  vader: { username: 'vader', pubkey: 'vaderPubkey' },
  yoda: { username: 'yoda', pubkey: 'yodaPubkey' },
  obi: { username: 'obi', pubkey: 'obiPubkey' },
  wookie: { username: 'wookie', pubkey: 'wookiePubkey' },
  leia: { username: 'leia', pubkey: 'leiaPubkey' },
  chad: { username: 'chad', pubkey: 'chadPubkey' },
  windoo: { username: 'windoo', pubkey: 'windooPubkey' },
  luke: { username: 'luke', pubkey: 'lukePubkey' },
  anakin: { username: 'anakin', pubkey: 'anakinPubkey' },
  alice: { username: 'alice', pubkey: 'alicePubkey' },
  john: { username: 'john', pubkey: 'johnPubkey' },
}

const formatDate = (timestamp: number) => {
  return DateTime.fromSeconds(timestamp).toFormat('HH:mm')
}

export const mock_messages = (message: DisplayableMessage | null = null) => {
  let placeholder: DisplayableMessage = {
    id: '32',
    type: 1,
    media: undefined,
    message: '*heavy breathing*',
    createdAt: OCT_28_2023,
    date: formatDate(OCT_28_2023),
    nickname: users.vader.username,
    isRegistered: true,
    isDuplicated: false,
    pubKey: users.vader.pubkey,
  }

  if (message !== null) {
    placeholder = message
  }

  const messages: {
    count: number
    groups: { [day: string]: DisplayableMessage[][] }
  } = {
    count: 32,
    groups: {
      'Oct 26, 2023': [
        [
          {
            id: '1',
            type: 1,
            message: 'Messages more there should be',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.yoda.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.yoda.pubkey,
          },
        ],
        [
          {
            id: '2',
            type: 1,
            message: 'I Agree',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.obi.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.obi.pubkey,
          },
          {
            id: '3',
            type: 1,
            message: 'Of course, I Agree',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.obi.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.obi.pubkey,
          },
        ],
        [
          {
            id: '4',
            type: 1,
            message: 'Wrough!',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.wookie.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.wookie.pubkey,
          },
        ],
        [
          {
            id: '5',
            type: 1,
            message: 'Yeah!',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.leia.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.leia.pubkey,
          },
        ],
        [
          {
            id: '6',
            type: 1,
            message: 'The more messages the better',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.luke.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.luke.pubkey,
          },
        ],
        [
          {
            id: '7',
            type: 1,
            message: 'We cannot grant you the rank of messager',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.windoo.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.windoo.pubkey,
          },
        ],
        [
          {
            id: '8',
            type: 1,
            message:
              'deathhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhstarrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrdeathstartttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.vader.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.vader.pubkey,
          },
        ],
      ],
      'Oct 27, 2023': [
        [
          {
            id: '9',
            type: 1,
            message: 'Luke, I am your father!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.chad.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.chad.pubkey,
          },
          {
            id: '10',
            type: 1,
            message: "That's impossible!",
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.chad.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.chad.pubkey,
          },
          {
            id: '11',
            type: 1,
            message: 'Nooo!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.chad.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.chad.pubkey,
          },
        ],
        [
          {
            id: '12',
            type: 1,
            message: 'Uhuhu!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.anakin.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.anakin.pubkey,
          },
        ],
        [
          {
            id: '13',
            type: 1,
            message: 'Why?',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.anakin.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.anakin.pubkey,
          },
        ],
        [
          {
            id: '14',
            type: 1,
            message: 'Messages more there should be',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.yoda.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.yoda.pubkey,
          },
        ],
        [
          {
            id: '15',
            type: 1,
            message: 'I Agree',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.obi.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.obi.pubkey,
          },
          {
            id: '16',
            type: 1,
            message: 'Of course, I Agree',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.obi.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.obi.pubkey,
          },
        ],
        [
          {
            id: '17',
            type: 1,
            message: 'Wrough!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.wookie.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.wookie.pubkey,
          },
        ],
        [
          {
            id: '18',
            type: 1,
            message: 'Yeah!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.leia.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.leia.pubkey,
          },
        ],
        [
          {
            id: '19',
            type: 1,
            message: 'The more messages the better',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.luke.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.luke.pubkey,
          },
        ],
        [
          {
            id: '20',
            type: 1,
            message: 'We cannot grant you the rank of messager',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.windoo.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.windoo.pubkey,
          },
        ],
        [
          {
            id: '21',
            type: 1,
            message:
              'deathhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhstarrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrdeathstartttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.vader.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.vader.pubkey,
          },
        ],
      ],
      'Oct 28, 2023': [
        [
          {
            id: '22',
            type: 1,
            message: 'Hello',
            createdAt: OCT_28_2023,
            date: formatDate(OCT_28_2023),
            nickname: users.alice.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.alice.pubkey,
          },
          {
            id: '23',
            type: 1,
            message:
              "How are you? My day was awesome. I removed a lot of unused props from container and I simplified code a lot. I like coding, coding is like building things with LEGO. I could admit it's a little bit harder and there's a lot that can go wrong but I like it anyway.",
            createdAt: OCT_28_2023,
            date: formatDate(OCT_28_2023),
            nickname: users.alice.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.alice.pubkey,
          },
        ],
        [
          {
            id: '24',
            type: 1,
            message: 'Great, thanks!',
            createdAt: OCT_28_2023,
            date: formatDate(OCT_28_2023),
            nickname: users.john.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.john.pubkey,
          },
        ],
      ],
      Today: [
        [
          {
            id: '25',
            type: 1,
            message: 'Luck, I am your father!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.chad.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.chad.pubkey,
          },
          {
            id: '26',
            type: 1,
            message: "That's impossible!",
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.chad.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.chad.pubkey,
          },
          {
            id: '27',
            type: 1,
            message: 'Nooo!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.chad.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.chad.pubkey,
          },
        ],
        [
          {
            id: '28',
            type: 1,
            message: 'Uhuhu!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.anakin.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.anakin.pubkey,
          },
        ],
        [
          {
            id: '29',
            type: 1,
            message: 'Why?',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.anakin.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.anakin.pubkey,
          },
        ],
        [
          {
            id: '30',
            type: 1,
            message: 'Messages more there should be',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.yoda.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.yoda.pubkey,
          },
        ],
        [
          {
            id: '31',
            type: 1,
            message: 'I Agree',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.obi.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.obi.pubkey,
          },
        ],
        [placeholder],
        [
          {
            id: '33',
            type: 1,
            message: 'Use the force, Luke!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.vader.username,
            isRegistered: true,
            isDuplicated: false,
            pubKey: users.vader.pubkey,
          },
        ],
      ],
    },
  }

  return messages
}
