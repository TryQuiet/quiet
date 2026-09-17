import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { Chat } from './Chat.component'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'
import type { UserProfile } from '@quiet/types'

/**
 * The mobile "New message" (DM recipient select) screen, transcribed from the designer's
 * Figma file "Direct Messages (DMs)" (tXuRsUfP6VnSv99dox00C1), page "Draft 1 & 2 and prototype":
 *
 *   - "Pre search"         823:14606 — empty query, full member list
 *   - "Pre search compose" 823:14772 — same, with the compose row focussed
 *   - "Populated focussed" 823:15126 — a query typed, filtered list, clear (x) in the field
 *
 * Names below are the designer's own placeholder content from those frames.
 */

const profile = (userId: string, nickname: string): UserProfile => ({
  userId,
  nickname,
})

const userProfiles: Record<string, UserProfile> = {
  denise: profile('denise', 'Denise'),
  holmes: profile('holmes', 'holmes'),
  gordon: profile('gordon', 'gordon'),
}

const me = profile('me', 'me')

const sharedProps = {
  contextMenu: {
    visible: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (_args?: any): any {},
  },
  sendMessageAction: storybookLog('Message sent'),
  loadMessagesAction: storybookLog('Messages loaded'),
  handleBackButton: storybookLog('Navigating back'),
  openImagePreview: () => {},
  openUrl: () => {},
  downloadFile: () => {},
  cancelDownload: () => {},
  updateFileAttachments: () => {},
  updateImageAttachments: () => {},
  removeFilePreview: () => {},
  channelName: '',
  // One person online, to draw the presence dot in the recipient list.
  isUserConnected: (userId: string | undefined) => userId === 'denise',
  messages: { count: 0, groups: {} },
  newChat: true,
  userProfiles,
  me,
  duplicatedUsernameHandleBack: function (): void {},
  unregisteredUsernameHandleBack: function (_nickname: string): void {},
  createOrSetDmChannelAction: function (): void {},
  setDmChannelOnSelection: function (): void {},
}

// One interactive story rather than one per frame: the search query lives in Chat's own state,
// so "Populated focussed" is reached by typing in the field (which also reveals the clear button)
// rather than by a separate story that would render identically to this one.
storiesOf('Chat/New message (DM designs)', module).add('Recipient select (823:14606 / 823:15126)', () => (
  <Chat {...sharedProps} />
))
