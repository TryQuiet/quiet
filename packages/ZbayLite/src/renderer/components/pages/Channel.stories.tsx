import React, { useCallback, useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

import ChannelComponent, { ChannelComponentProps } from './Channel'
import { DisplayableMessage } from '@zbayapp/nectar'

const Template: ComponentStory<typeof ChannelComponent> = args => {
  const [messages, _setMessages] = useState<{
    count: number
    groups: { [day: string]: DisplayableMessage[][] }
  }>({
    count: 16,
    groups: {
      '28 Oct': [
        [
          {
            id: '1',
            type: 1,
            message: 'Hello',
            createdAt: 0,
            date: '28 Oct, 10:00',
            nickname: 'holmes'
          },
          {
            id: '2',
            type: 1,
            message:
              "How are you? My day was awesome. I removed a lot of unused props from container and I simplified code a lot. I like coding, coding is like building things with LEGO. I could admit it's a little bit harder and there's a lot that can go wrong but I like it anyway.",
            createdAt: 0,
            date: '28 Oct, 10:01',
            nickname: 'holmes'
          }
        ],
        [
          {
            id: '3',
            type: 1,
            message: 'Great, thanks!',
            createdAt: 0,
            date: '28 Oct, 10:02',
            nickname: 'bartek'
          }
        ]
      ],
      Today: [
        [
          {
            id: '4',
            type: 1,
            message: 'Luck, I am your father!',
            createdAt: 0,
            date: '12:40',
            nickname: 'wiktor'
          },
          {
            id: '5',
            type: 1,
            message: 'That\'s impossible!',
            createdAt: 0,
            date: '12:41',
            nickname: 'wiktor'
          },
          {
            id: '6',
            type: 1,
            message: 'Nooo!',
            createdAt: 0,
            date: '12:45',
            nickname: 'wiktor'
          }
        ],
        [
          {
            id: '7',
            type: 1,
            message: 'Uhuhu!',
            createdAt: 0,
            date: '12:46',
            nickname: 'anakin'
          }
        ],
        [
          {
            id: '8',
            type: 1,
            message: 'Why?',
            createdAt: 0,
            date: '12:46',
            nickname: 'anakin'
          }
        ],
        [
          {
            id: '9',
            type: 1,
            message: 'Messages more there should be',
            createdAt: 0,
            date: '12:46',
            nickname: 'yoda'
          }
        ],
        [
          {
            id: '11',
            type: 1,
            message: 'I Agree',
            createdAt: 0,
            date: '12:46',
            nickname: 'obi'
          },
          {
            id: '12',
            type: 1,
            message: 'Of course, I Agree',
            createdAt: 0,
            date: '12:46',
            nickname: 'obi'
          }
        ],
        [
          {
            id: '13',
            type: 1,
            message: 'Wrough!',
            createdAt: 0,
            date: '12:46',
            nickname: 'wookie'
          }
        ],
        [
          {
            id: '14',
            type: 1,
            message: 'Yeah!',
            createdAt: 0,
            date: '12:46',
            nickname: 'leah'
          }
        ],
        [
          {
            id: '15',
            type: 1,
            message: 'The more messages the better',
            createdAt: 0,
            date: '12:46',
            nickname: 'luke'
          }
        ],
        [
          {
            id: '16',
            type: 1,
            message: 'We cannot grant you the rank of messager',
            createdAt: 0,
            date: '12:46',
            nickname: 'windoo'
          }
        ]
      ]
    }
  })

  const sendMessage = useCallback((_message: string) => {}, [])

  args.messages = messages

  args.onInputEnter = sendMessage

  return <ChannelComponent {...args} />
}

export const Component = Template.bind({})

const args: ChannelComponentProps = {
  user: {
    id: 'id',
    zbayNickname: 'wiktor',
    hiddenService: {
      onionAddress: 'onionAddress',
      privateKey: 'privateKey'
    },
    peerId: {
      id: 'id',
      privKey: 'privKey',
      pubKey: 'pubKey'
    },
    dmKeys: {
      publicKey: 'publicKey',
      privateKey: 'privateKey'
    },
    userCsr: {
      userCsr: 'userCsr',
      userKey: 'userKey',
      pkcs10: {
        publicKey: 'publicKey',
        privateKey: 'privateKey',
        pkcs10: 'pkcs10'
      }
    },
    userCertificate: 'userCertificate'
  },
  channel: {
    name: 'general',
    description: 'This is awesome channel in which you can chat with your friends',
    owner: 'holmes',
    timestamp: 1636971603355,
    address: 'channelAddress'
  },
  channelSettingsModal: {
    open: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {}
  },
  channelInfoModal: {
    open: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {}
  },
  messages: {
    count: 0,
    groups: {}
  },
  setChannelLoadingSlice: function (_value: number): void {},
  onDelete: function (): void {},
  onInputChange: function (_value: string): void {},
  onInputEnter: function (_message: string): void {},
  mutedFlag: false,
  notificationFilter: '',
  openNotificationsTab: function (): void {}
}

Component.args = args

const component: ComponentMeta<typeof ChannelComponent> = {
  title: 'Components/ChannelComponent',
  decorators: [withTheme],
  component: ChannelComponent
}

export default component
