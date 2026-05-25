import React from 'react'
import { storiesOf } from '@storybook/react-native'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { Chat } from './Chat.component'
import { DocumentPickerResponse } from 'react-native-document-picker'
import { Asset } from 'react-native-image-picker'
import { createLogger } from '../../utils/logger'

const logger = createLogger('chat:stories')

storiesOf('Chat', module)
  .add('Default', () => (
    <Chat
      contextMenu={{
        visible: false,
        handleOpen: function (_args?: any): any {},
        handleClose: function (_args?: any): any {},
      }}
      sendMessageAction={storybookLog('Message sent')}
      loadMessagesAction={storybookLog('Messages loaded')}
      handleBackButton={storybookLog('Navigating back')}
      openImagePreview={() => {}}
      openUrl={() => {}}
      downloadFile={() => {}}
      cancelDownload={() => {}}
      channel={{
        name: 'Quiet',
        description: '',
        owner: '',
        timestamp: 0,
        id: '',
        public: true,
        teamId: 'foobar',
      }}
      messages={{
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
                nickname: 'alice',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
              {
                id: '2',
                type: 1,
                message:
                  "How are you? My day was awesome. I removed a lot of unused props from container and I simplified code a lot. I like coding, coding is like building things with LEGO. I could admit it's a little bit harder and there's a lot that can go wrong but I like it anyway.",
                createdAt: 0,
                date: '28 Oct, 10:01',
                nickname: 'alice',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
            ],
            [
              {
                id: '3',
                type: 1,
                message: 'Great, thanks!',
                createdAt: 0,
                date: '28 Oct, 10:02',
                nickname: 'john',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
            ],
          ],
          Today: [
            [
              {
                id: '4',
                type: 1,
                message: 'Luck, I am your father!',
                createdAt: 0,
                date: '12:40',
                nickname: 'chad',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
              {
                id: '5',
                type: 1,
                message: "That's impossible!",
                createdAt: 0,
                date: '12:41',
                nickname: 'chad',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
              {
                id: '6',
                type: 1,
                message: 'Nooo!',
                createdAt: 0,
                date: '12:45',
                nickname: 'chad',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
            ],
            [
              {
                id: '7',
                type: 1,
                message: 'Uhuhu!',
                createdAt: 0,
                date: '12:46',
                nickname: 'anakin',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
            ],
            [
              {
                id: '8',
                type: 1,
                message: 'Why?',
                createdAt: 0,
                date: '12:46',
                nickname: 'anakin',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
            ],
            [
              {
                id: '9',
                type: 1,
                message: 'Messages more there should be',
                createdAt: 0,
                date: '12:46',
                nickname: 'yoda',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
            ],
            [
              {
                id: '11',
                type: 1,
                message: 'I Agree',
                createdAt: 0,
                date: '12:46',
                nickname: 'obi',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
              {
                id: '12',
                type: 1,
                message: 'Of course, I Agree',
                createdAt: 0,
                date: '12:46',
                nickname: 'obi',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
            ],
            [
              {
                id: '13',
                type: 1,
                message: 'Wrough!',
                createdAt: 0,
                date: '12:46',
                nickname: 'wookie',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
            ],
            [
              {
                id: '14',
                type: 1,
                message: 'Yeah!',
                createdAt: 0,
                date: '12:46',
                nickname: 'leah',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
            ],
            [
              {
                id: '15',
                type: 1,
                message: 'The more messages the better',
                createdAt: 0,
                date: '12:46',
                nickname: 'luke',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
            ],
            [
              {
                id: '16',
                type: 1,
                message: 'We cannot grant you the rank of messager',
                createdAt: 0,
                date: '12:46',
                nickname: 'windoo',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
            ],
            [
              {
                id: '16',
                type: 1,
                message:
                  'deathhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhstarrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrdeathstartttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
                createdAt: 0,
                date: '12:46',
                nickname: 'vader',
                isDuplicated: false,
                isRegistered: true,
                userId: 'test',
              },
            ],
          ],
        },
      }}
      updateFileAttachments={function (_filesData: DocumentPickerResponse[]): void {
        logger.info('updateFileAttachments')
      }}
      updateImageAttachments={function (_assets: Asset[]): void {
        logger.info('updateImageAttachments')
      }}
      removeFilePreview={function (id: string): void {
        logger.info(`removeFilePreview ${id}`)
      }}
      duplicatedUsernameHandleBack={function (): void {}}
      unregisteredUsernameHandleBack={function (nickname: string): void {}}
    />
  ))
  .add('Empty', () => (
    <Chat
      contextMenu={{
        visible: false,
        handleOpen: function (_args?: any): any {},
        handleClose: function (_args?: any): any {},
      }}
      sendMessageAction={storybookLog('Message sent')}
      loadMessagesAction={storybookLog('Messages loaded')}
      handleBackButton={storybookLog('Navigating back')}
      openImagePreview={() => {}}
      openUrl={() => {}}
      downloadFile={() => {}}
      cancelDownload={() => {}}
      channel={{
        name: 'Quiet',
        description: '',
        owner: '',
        timestamp: 0,
        id: '',
        public: true,
        teamId: 'foobar',
      }}
      updateFileAttachments={function (_filesData: DocumentPickerResponse[]): void {
        logger.info('updateFileAttachments')
      }}
      updateImageAttachments={function (_assets: Asset[]): void {
        logger.info('updateImageAttachments')
      }}
      removeFilePreview={function (id: string): void {
        logger.info(`removeFilePreview ${id}`)
      }}
      duplicatedUsernameHandleBack={function (): void {}}
      unregisteredUsernameHandleBack={function (nickname: string): void {}}
    />
  ))
  .add('MultiDayChat', () => (
    <Chat
      contextMenu={{
        visible: false,
        handleOpen: function (_args?: any): any {},
        handleClose: function (_args?: any): any {},
      }}
      sendMessageAction={storybookLog('Message sent')}
      loadMessagesAction={storybookLog('Messages loaded')}
      handleBackButton={storybookLog('Navigating back')}
      openImagePreview={() => {}}
      openUrl={() => {}}
      downloadFile={() => {}}
      cancelDownload={() => {}}
      updateFileAttachments={function (_filesData: DocumentPickerResponse[]): void {
        logger.info('updateFileAttachments')
      }}
      updateImageAttachments={function (_assets: Asset[]): void {
        logger.info('updateImageAttachments')
      }}
      removeFilePreview={function (id: string): void {
        logger.info(`removeFilePreview ${id}`)
      }}
      channel={{
        name: 'StickyDateTest',
        description: 'Testing sticky date markers',
        owner: '',
        timestamp: 0,
        id: 'sticky-date-test',
        public: true,
        teamId: 'foobar',
      }}
      messages={{
        count: 40,
        groups: {
          '25 Mar': [
            [
              {
                id: 'march25-1',
                type: 1,
                message: 'This message is from March 25',
                createdAt: 0,
                date: '25 Mar, 10:00',
                nickname: 'alice',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
              {
                id: 'march25-2',
                type: 1,
                message: 'Second message from March 25',
                createdAt: 0,
                date: '25 Mar, 10:01',
                nickname: 'alice',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march25-3',
                type: 1,
                message: 'Message from Bob on March 25',
                createdAt: 0,
                date: '25 Mar, 10:15',
                nickname: 'bob',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march25-4',
                type: 1,
                message: 'Yet another March 25 message',
                createdAt: 0,
                date: '25 Mar, 11:30',
                nickname: 'alice',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march25-5',
                type: 1,
                message: 'Lunch time message on March 25',
                createdAt: 0,
                date: '25 Mar, 12:30',
                nickname: 'charlie',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march25-6',
                type: 1,
                message: 'Afternoon message on March 25',
                createdAt: 0,
                date: '25 Mar, 15:45',
                nickname: 'dave',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march25-7',
                type: 1,
                message: 'Evening message on March 25',
                createdAt: 0,
                date: '25 Mar, 18:20',
                nickname: 'eve',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march25-8',
                type: 1,
                message: 'Last message from March 25',
                createdAt: 0,
                date: '25 Mar, 23:59',
                nickname: 'bob',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
          ],
          '26 Mar': [
            [
              {
                id: 'march26-1',
                type: 1,
                message: 'This message is from March 26',
                createdAt: 0,
                date: '26 Mar, 00:01',
                nickname: 'charlie',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march26-2',
                type: 1,
                message: 'Early morning on March 26',
                createdAt: 0,
                date: '26 Mar, 07:15',
                nickname: 'alice',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march26-3',
                type: 1,
                message: 'Another message from March 26',
                createdAt: 0,
                date: '26 Mar, 09:20',
                nickname: 'dave',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march26-4',
                type: 1,
                message: 'March 26 message about testing date markers',
                createdAt: 0,
                date: '26 Mar, 10:30',
                nickname: 'bob',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march26-5',
                type: 1,
                message: 'Mid-day on March 26',
                createdAt: 0,
                date: '26 Mar, 12:00',
                nickname: 'dave',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
              {
                id: 'march26-6',
                type: 1,
                message:
                  'The sticky date markers should update correctly when scrolling through this long conversation',
                createdAt: 0,
                date: '26 Mar, 12:01',
                nickname: 'dave',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march26-7',
                type: 1,
                message:
                  'This is a test of a longer message that will take up more space on the screen, forcing more scrolling to see all the messages in the conversation. The sticky date markers should correctly stick to the top of the screen during scrolling and then update to reflect the current visible date range.',
                createdAt: 0,
                date: '26 Mar, 13:45',
                nickname: 'charlie',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march26-8',
                type: 1,
                message: 'Afternoon message on March 26',
                createdAt: 0,
                date: '26 Mar, 15:20',
                nickname: 'frank',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march26-9',
                type: 1,
                message: 'Late afternoon on March 26',
                createdAt: 0,
                date: '26 Mar, 17:30',
                nickname: 'grace',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march26-10',
                type: 1,
                message: 'Evening message on March 26',
                createdAt: 0,
                date: '26 Mar, 19:55',
                nickname: 'henry',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march26-11',
                type: 1,
                message:
                  'Another long message for March 26 to increase the amount of scrolling needed to get through all the content. This helps us test whether the sticky date markers correctly update when scrolling through a conversation with multiple dates and lots of content.',
                createdAt: 0,
                date: '26 Mar, 21:10',
                nickname: 'alice',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'march26-12',
                type: 1,
                message: 'Late night message on March 26',
                createdAt: 0,
                date: '26 Mar, 23:30',
                nickname: 'bob',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
          ],
          Today: [
            [
              {
                id: 'today-1',
                type: 1,
                message: 'First message from today',
                createdAt: 0,
                date: '09:00',
                nickname: 'eve',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'today-2',
                type: 1,
                message: 'Another message from early today',
                createdAt: 0,
                date: '09:15',
                nickname: 'dave',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'today-3',
                type: 1,
                message: 'Second message from today',
                createdAt: 0,
                date: '10:00',
                nickname: 'frank',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'today-4',
                type: 1,
                message: "This is today's message about sticky date markers",
                createdAt: 0,
                date: '10:30',
                nickname: 'alice',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
              {
                id: 'today-5',
                type: 1,
                message: 'We need to make sure they work correctly with multiple days of messages',
                createdAt: 0,
                date: '10:31',
                nickname: 'alice',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'today-6',
                type: 1,
                message: 'Third message from today',
                createdAt: 0,
                date: '11:00',
                nickname: 'grace',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'today-7',
                type: 1,
                message: 'We need to ensure that there are enough messages to force scrolling',
                createdAt: 0,
                date: '11:15',
                nickname: 'bob',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'today-8',
                type: 1,
                message:
                  'This is a fairly long message for today that should take up multiple lines in the chat view, requiring more scrolling to see all messages. This helps test the sticky date marker functionality with varying message lengths.',
                createdAt: 0,
                date: '11:45',
                nickname: 'charlie',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'today-9',
                type: 1,
                message: 'Midday message from today',
                createdAt: 0,
                date: '12:00',
                nickname: 'henry',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
            [
              {
                id: 'today-10',
                type: 1,
                message: 'One final message for testing',
                createdAt: 0,
                date: '12:30',
                nickname: 'eve',
                isDuplicated: false,
                isRegistered: true,
                pubkey: 'test',
                userId: 'user-id',
              },
            ],
          ],
        },
      }}
      duplicatedUsernameHandleBack={function (): void {}}
      unregisteredUsernameHandleBack={function (nickname: string): void {}}
    />
  ))
