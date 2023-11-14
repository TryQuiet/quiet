import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { Message } from './Message.component'
import { MessageType } from '@quiet/types'

storiesOf('Message', module)
  .add('Default', () => {
    return (
      <Message
        duplicatedUsernameHandleBack={function (): void {}}
        unregisteredUsernameHandleBack={function (username: string): void {}}
        data={[
          {
            id: '1',
            type: MessageType.Basic,
            message:
              'Brownie powder marshmallow dessert carrot cake marzipan cake caramels. Muffin topping wafer jelly apple pie candy. Fruitcake chocolate pudding fruitcake candy lemon drops chocolate.',
            createdAt: 0,
            date: '1:30pm',
            nickname: 'holmes',
            isDuplicated: false,
            isRegistered: true,
            pubKey: 'test',
          },
        ]}
        openUrl={() => {}}
        openImagePreview={() => {}}
        downloadFile={() => {}}
        cancelDownload={() => {}}
      />
    )
  })
  .add('Info', () => {
    return (
      <Message
        duplicatedUsernameHandleBack={function (): void {}}
        unregisteredUsernameHandleBack={function (username: string): void {}}
        data={[
          {
            id: '1',
            type: MessageType.Info,
            message: 'Hey, @the-emperor just joined!',
            createdAt: 0,
            date: '1:30pm',
            nickname: 'holmes',
            isDuplicated: false,
            isRegistered: true,
            pubKey: 'test',
          },
        ]}
        openUrl={() => {}}
        openImagePreview={() => {}}
        downloadFile={() => {}}
        cancelDownload={() => {}}
      />
    )
  })
  .add('Link', () => {
    const openUrl = (url: string) => {
      console.log(`opened url ${url}`)
    }
    return (
      <Message
        duplicatedUsernameHandleBack={function (): void {}}
        unregisteredUsernameHandleBack={function (username: string): void {}}
        data={[
          {
            id: '1',
            type: MessageType.Info,
            message: 'Check this out https://github.com/orgs/TryQuiet/projects/1',
            createdAt: 0,
            date: '1:30pm',
            nickname: 'holmes',
            isDuplicated: false,
            isRegistered: true,
            pubKey: 'test',
          },
        ]}
        openUrl={openUrl}
        openImagePreview={() => {}}
        downloadFile={() => {}}
        cancelDownload={() => {}}
      />
    )
  })
  .add('ValidInlineLatexExpression', () => {
    return (
      <Message
        duplicatedUsernameHandleBack={function (): void {}}
        unregisteredUsernameHandleBack={function (username: string): void {}}
        data={[
          {
            id: '1',
            type: MessageType.Basic,
            message: '$$sum_{i=0}^n i = \frac{n(n+1)}{2}$$', // eslint-disable-line no-useless-escape
            createdAt: 0,
            date: '1:30pm',
            nickname: 'someone',
            isDuplicated: false,
            isRegistered: true,
            pubKey: 'test',
          },
        ]}
        openUrl={() => {}}
        openImagePreview={() => {}}
        downloadFile={() => {}}
        cancelDownload={() => {}}
      />
    )
  })
  .add('InvalidLatexExpression', () => {
    return (
      <Message
        duplicatedUsernameHandleBack={function (): void {}}
        unregisteredUsernameHandleBack={function (username: string): void {}}
        data={[
          {
            id: '1',
            type: MessageType.Basic,
            message: '$$$$ $$',
            createdAt: 0,
            date: '1:30pm',
            nickname: 'someone',
            isDuplicated: false,
            isRegistered: true,
            pubKey: 'test',
          },
        ]}
        openUrl={() => {}}
        openImagePreview={() => {}}
        downloadFile={() => {}}
        cancelDownload={() => {}}
      />
    )
  })
