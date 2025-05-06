import { DisplayableMessage } from '@quiet/types'
import { DateTime } from 'luxon'

const OCT_28_2023 = 1698451200 // Unix timestamp for Oct 28, 2023 00:00:00 UTC
const OCT_27_2023 = OCT_28_2023 - 86400 // Previous day
const OCT_26_2023 = OCT_27_2023 - 86400 // Two days before

export const users = {
  vader: { nickname: 'vader', userId: 'vaderUserId' },
  yoda: { nickname: 'yoda', userId: 'yodaUserId' },
  obi: { nickname: 'obi', userId: 'obiUserId' },
  wookie: { nickname: 'wookie', userId: 'wookieUserId' },
  leia: { nickname: 'leia', userId: 'leiaUserId' },
  chad: { nickname: 'chad', userId: 'chadUserId' },
  windoo: { nickname: 'windoo', userId: 'windooUserId' },
  luke: { nickname: 'luke', userId: 'lukeUserId' },
  anakin: { nickname: 'anakin', userId: 'anakinUserId' },
  alice: { nickname: 'alice', userId: 'aliceUserId' },
  john: { nickname: 'john', userId: 'johnUserId' },
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
    nickname: users.vader.nickname,
    isRegistered: true,
    isDuplicated: false,
    userId: users.vader.userId,
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
            nickname: users.yoda.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.yoda.userId,
          },
        ],
        [
          {
            id: '2',
            type: 1,
            message: 'I Agree',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.obi.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.obi.userId,
          },
          {
            id: '3',
            type: 1,
            message: 'Of course, I Agree',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.obi.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.obi.userId,
          },
        ],
        [
          {
            id: '4',
            type: 1,
            message: 'Wrough!',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.wookie.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.wookie.userId,
          },
        ],
        [
          {
            id: '5',
            type: 1,
            message: 'Yeah!',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.leia.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.leia.userId,
          },
        ],
        [
          {
            id: '6',
            type: 1,
            message: 'The more messages the better',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.luke.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.luke.userId,
          },
        ],
        [
          {
            id: '7',
            type: 1,
            message: 'We cannot grant you the rank of messager',
            createdAt: OCT_26_2023,
            date: formatDate(OCT_26_2023),
            nickname: users.windoo.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.windoo.userId,
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
            nickname: users.vader.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.vader.userId,
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
            nickname: users.chad.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.chad.userId,
          },
          {
            id: '10',
            type: 1,
            message: "That's impossible!",
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.chad.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.chad.userId,
          },
          {
            id: '11',
            type: 1,
            message: 'Nooo!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.chad.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.chad.userId,
          },
        ],
        [
          {
            id: '12',
            type: 1,
            message: 'Uhuhu!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.anakin.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.anakin.userId,
          },
        ],
        [
          {
            id: '13',
            type: 1,
            message: 'Why?',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.anakin.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.anakin.userId,
          },
        ],
        [
          {
            id: '14',
            type: 1,
            message: 'Messages more there should be',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.yoda.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.yoda.userId,
          },
        ],
        [
          {
            id: '15',
            type: 1,
            message: 'I Agree',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.obi.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.obi.userId,
          },
          {
            id: '16',
            type: 1,
            message: 'Of course, I Agree',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.obi.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.obi.userId,
          },
        ],
        [
          {
            id: '17',
            type: 1,
            message: 'Wrough!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.wookie.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.wookie.userId,
          },
        ],
        [
          {
            id: '18',
            type: 1,
            message: 'Yeah!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.leia.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.leia.userId,
          },
        ],
        [
          {
            id: '19',
            type: 1,
            message: 'The more messages the better',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.luke.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.luke.userId,
          },
        ],
        [
          {
            id: '20',
            type: 1,
            message: 'We cannot grant you the rank of messager',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.windoo.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.windoo.userId,
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
            nickname: users.vader.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.vader.userId,
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
            nickname: users.alice.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.alice.userId,
          },
          {
            id: '23',
            type: 1,
            message:
              "How are you? My day was awesome. I removed a lot of unused props from container and I simplified code a lot. I like coding, coding is like building things with LEGO. I could admit it's a little bit harder and there's a lot that can go wrong but I like it anyway.",
            createdAt: OCT_28_2023,
            date: formatDate(OCT_28_2023),
            nickname: users.alice.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.alice.userId,
          },
        ],
        [
          {
            id: '24',
            type: 1,
            message: 'Great, thanks!',
            createdAt: OCT_28_2023,
            date: formatDate(OCT_28_2023),
            nickname: users.john.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.john.userId,
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
            nickname: users.chad.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.chad.userId,
          },
          {
            id: '26',
            type: 1,
            message: "That's impossible!",
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.chad.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.chad.userId,
          },
          {
            id: '27',
            type: 1,
            message: 'Nooo!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.chad.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.chad.userId,
          },
        ],
        [
          {
            id: '28',
            type: 1,
            message: 'Uhuhu!',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.anakin.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.anakin.userId,
          },
        ],
        [
          {
            id: '29',
            type: 1,
            message: 'Why?',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.anakin.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.anakin.userId,
          },
        ],
        [
          {
            id: '30',
            type: 1,
            message: 'Messages more there should be',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.yoda.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.yoda.userId,
          },
        ],
        [
          {
            id: '31',
            type: 1,
            message: 'I Agree',
            createdAt: OCT_27_2023,
            date: formatDate(OCT_27_2023),
            nickname: users.obi.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.obi.userId,
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
            nickname: users.vader.nickname,
            isRegistered: true,
            isDuplicated: false,
            userId: users.vader.userId,
          },
        ],
      ],
    },
  }

  return messages
}
