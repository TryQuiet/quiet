import React from 'react'
import { within } from '@testing-library/react-native'
import { DownloadState, MessageType, type DisplayableMessage, type FileMetadata } from '@quiet/types'
import { Message } from './Message.component'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

it('shows each attachment status by message ID when text and files share a sender group', () => {
  const base = {
    createdAt: 0,
    date: '12:00',
    nickname: 'Bob',
    userId: 'bob',
    isRegistered: true,
    isDuplicated: false,
  }
  const data: DisplayableMessage[] = [
    { ...base, id: 'bob:text', type: MessageType.Basic, message: 'Private files follow' },
    ...['first', 'second'].map(name => ({
      ...base,
      id: `bob:${name}`,
      type: MessageType.File,
      message: '',
      media: { name, ext: '.txt', size: 87, cid: name } as FileMetadata,
    })),
  ]
  const result = renderComponent(
    <Message
      data={data}
      downloadStatuses={{
        'bob:first': { mid: 'bob:first', cid: 'first', downloadState: DownloadState.Completed },
        'bob:second': { mid: 'bob:second', cid: 'second', downloadState: DownloadState.Downloading },
      }}
      downloadFile={jest.fn()}
      cancelDownload={jest.fn()}
      openImagePreview={jest.fn()}
      openUrl={jest.fn()}
      duplicatedUsernameHandleBack={jest.fn()}
      unregisteredUsernameHandleBack={jest.fn()}
    />
  )
  expect(within(result.getByTestId('file-attachment-bob:first')).getByText('Downloaded')).toBeTruthy()
  expect(within(result.getByTestId('file-attachment-bob:second')).getByText('Downloading...')).toBeTruthy()
})
