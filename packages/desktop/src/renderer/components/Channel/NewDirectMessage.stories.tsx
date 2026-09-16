import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { NewDirectMessageComponent, NewDirectMessageComponentProps } from './NewDirectMessage.component'
import { UploadFilesPreviewsProps } from './File/FileAttachmentPreview'
import { FileActionsProps } from './File/FileComponent/FileComponent'
import { withTheme, withDragDrop } from '../../storybook/decorators'
import { UserProfile } from '@quiet/types'

/**
 * Desktop DM recipient selection — the "New message" view reached from the + next to Direct
 * messages. Picking recipients here is what creates the conversation, so this is the surface to
 * review for the To: field, the member search and the empty-conversation state.
 */

const NAMES = [
  'denise',
  'gordon',
  'annabelle',
  'christopher',
  'bartholomew',
  'evangelina',
  'maximilian',
  'seraphina',
  'nathaniel',
  'persephone',
]

const me: UserProfile = {
  userId: 'meUserId',
  nickname: 'holmes',
  userData: { peerId: 'mePeerId', onionAddress: 'me.onion' },
  channels: [],
}

const userProfiles: Record<string, UserProfile> = { meUserId: me }
NAMES.forEach(nickname => {
  userProfiles[`${nickname}UserId`] = {
    userId: `${nickname}UserId`,
    nickname,
    userData: { peerId: `${nickname}PeerId`, onionAddress: `${nickname}.onion` },
    channels: [],
  }
})

const args = {
  user: me,
  userProfiles,
  channelId: '',
  channelName: '',
  handleClose: () => {},
  handleInputChange: () => {},
  setOrCreateDmChannel: () => {},
  messages: { count: 0, groups: {} },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newestMessage: undefined as any,
  pendingMessages: {},
  downloadStatuses: {},
  maxAutodownloadSizeBytes: 10485760,
  lazyLoading: () => {},
  onInputChange: () => {},
  onInputEnter: () => {},
  openUrl: () => {},
  openFilesDialog: () => {},
  handleFileDrop: () => {},
  handleClipboardFiles: () => {},
  pendingGeneralChannelRecreation: false,
  unregisteredUsernameModalHandleOpen: () => {},
  duplicatedUsernameModalHandleOpen: () => {},
  filesData: {},
  removeFile: () => {},
  openContainingFolder: () => {},
  downloadFile: () => {},
  cancelDownload: () => {},
} as unknown as NewDirectMessageComponentProps & UploadFilesPreviewsProps & FileActionsProps

const Template: ComponentStory<typeof NewDirectMessageComponent> = arguments_ => (
  <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
    <NewDirectMessageComponent {...arguments_} />
  </div>
)

export const RecipientSelection = Template.bind({})
RecipientSelection.args = args

const component: ComponentMeta<typeof NewDirectMessageComponent> = {
  title: 'Components/DirectMessages/NewDirectMessage',
  component: NewDirectMessageComponent,
  decorators: [withDragDrop, withTheme],
}

export default component
