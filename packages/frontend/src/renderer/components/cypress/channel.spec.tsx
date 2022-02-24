import React from 'react'
import { mount } from '@cypress/react'
import { composeStories } from "@storybook/testing-react";
import { Component as Channel } from '../Channel/Channel.stories'

import { it } from 'local-cypress'

const Primary = composeStories(Channel)

it('should render basic component', () => {
  mount(<Channel />)
})

// const args: ChannelComponentProps = {
//     user: {
//       id: 'id',
//       nickname: 'chad',
//       hiddenService: {
//         onionAddress: 'onionAddress',
//         privateKey: 'privateKey'
//       },
//       peerId: {
//         id: 'id',
//         privKey: 'privKey',
//         pubKey: 'pubKey'
//       },
//       dmKeys: {
//         publicKey: 'publicKey',
//         privateKey: 'privateKey'
//       },
//       userCsr: {
//         userCsr: 'userCsr',
//         userKey: 'userKey',
//         pkcs10: {
//           publicKey: 'publicKey',
//           privateKey: 'privateKey',
//           pkcs10: 'pkcs10'
//         }
//       },
//       userCertificate: 'userCertificate'
//     },
//     channel: {
//       name: 'general',
//       description: 'This is awesome channel in which you can chat with your friends',
//       owner: 'alice',
//       timestamp: 1636971603355,
//       address: 'channelAddress'
//     },
//     channelSettingsModal: {
//       open: false,
//       handleOpen: function (_args?: any): any {},
//       handleClose: function (): any {}
//     },
//     channelInfoModal: {
//       open: false,
//       handleOpen: function (_args?: any): any {},
//       handleClose: function (): any {}
//     },
//     messages: {
//       count: 0,
//       groups: {}
//     },
//     setChannelLoadingSlice: function (_value: number): void {},
//     onDelete: function (): void {},
//     onInputChange: function (_value: string): void {},
//     onInputEnter: function (_message: string): void {},
//     mutedFlag: false,
//     notificationFilter: '',
//     openNotificationsTab: function (): void {}
//   }

// describe('Basic scroll', () => {
//     it('renders component', () => {
//         mount(<ChannelComponent user={args.user} channel={args.channel} channelSettingsModal={args.channelSettingsModal} channelInfoModal={args.channelInfoModal} messages={args.messages} setChannelLoadingSlice={args.setChannelLoadingSlice} onDelete={args.onDelete} onInputChange={args.onInputChange} onInputEnter={args.onInputEnter} mutedFlag={args.mutedFlag} notificationFilter={args.notificationFilter} openNotificationsTab={args.openNotificationsTab}/>)
//     })
// })