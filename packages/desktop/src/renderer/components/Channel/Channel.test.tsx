import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { ipcRenderer } from 'electron'
import { files, messages, publicChannels } from '@quiet/state-manager'
import Channel from './Channel'
import { type ChannelComponentProps } from './ChannelComponent'

const mockDispatch = jest.fn()
const mockSelections = new Map()
const mockListeners = new Map<string, Set<(...args: any[]) => void>>()

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: unknown) => mockSelections.get(selector),
}))
jest.mock('electron', () => ({
  ipcRenderer: {
    send: jest.fn(),
    on: (event: string, listener: (...args: any[]) => void) => {
      if (!mockListeners.has(event)) mockListeners.set(event, new Set())
      mockListeners.get(event)!.add(listener)
    },
    removeListener: (event: string, listener: (...args: any[]) => void) => {
      mockListeners.get(event)?.delete(listener)
    },
  },
  webUtils: { getPathForFile: (file: { path: string }) => file.path },
}))
jest.mock('../../containers/hooks', () => ({ useModal: () => ({}) }))
jest.mock('../../../hooks/useContextMenu', () => ({ useContextMenu: () => ({}) }))
jest.mock('./ChannelComponent', () => ({
  __esModule: true,
  default: ({ onInputEnter, handleFileDrop, openFilesDialog, handleClipboardFiles }: ChannelComponentProps) => (
    <>
      <button onClick={() => handleFileDrop({ files: [{ path: '/file.txt' }] })}>Attach</button>
      <button onClick={() => onInputEnter('message')}>Send</button>
      <button onClick={openFilesDialog}>Dialog</button>
      <button onClick={() => handleClipboardFiles(new ArrayBuffer(1), '.png', 'clipboard')}>Paste</button>
    </>
  ),
}))

beforeEach(() => {
  mockDispatch.mockClear()
  mockSelections.clear()
  mockListeners.clear()
})

const selectChannel = (id: string, isPublic: boolean) => {
  mockSelections.set(publicChannels.selectors.currentChannelId, id)
  mockSelections.set(publicChannels.selectors.currentChannelName, 'same-name')
  mockSelections.set(publicChannels.selectors.currentChannel, { id, name: 'same-name', public: isPublic })
}

const emitIpc = (event: string, ...args: any[]) => {
  act(() => {
    mockListeners.get(event)?.forEach(listener => listener({}, ...args))
  })
}

it('submits text and attachments with the channel displayed by that composer', () => {
  mockSelections.set(publicChannels.selectors.currentChannelId, 'private-channel')
  const view = render(<Channel />)
  fireEvent.click(view.getByText('Attach'))
  fireEvent.click(view.getByText('Send'))
  expect(mockDispatch).toHaveBeenCalledWith(
    messages.actions.sendMessage({ message: 'message', channelId: 'private-channel' })
  )
  expect(mockDispatch).toHaveBeenCalledWith(
    files.actions.attachFile({ path: '/file.txt', name: 'file', ext: '.txt', channelId: 'private-channel' })
  )

  mockSelections.set(publicChannels.selectors.currentChannelId, 'public-channel')
  view.rerender(<Channel />)
  fireEvent.click(view.getByText('Attach'))
  fireEvent.click(view.getByText('Send'))
  expect(mockDispatch).toHaveBeenCalledWith(
    messages.actions.sendMessage({ message: 'message', channelId: 'public-channel' })
  )
  expect(mockDispatch).toHaveBeenCalledWith(
    files.actions.attachFile({ path: '/file.txt', name: 'file', ext: '.txt', channelId: 'public-channel' })
  )
})

it('discards an unsubmitted private attachment when switching to a same-name public channel', () => {
  selectChannel('private-channel', false)
  const view = render(<Channel />)
  fireEvent.click(view.getByText('Attach'))

  selectChannel('public-channel', true)
  view.rerender(<Channel />)
  fireEvent.click(view.getByText('Send'))

  expect(mockDispatch).toHaveBeenCalledWith(
    messages.actions.sendMessage({ message: 'message', channelId: 'public-channel' })
  )
  expect(mockDispatch.mock.calls.some(([action]) => action.type === files.actions.attachFile.type)).toBe(false)
  expect(mockListeners.get('openedFiles')?.size).toBe(1)
  expect(mockListeners.get('writeTempFileReply')?.size).toBe(1)
})

it('binds file dialog and clipboard replies to their originating channel', () => {
  selectChannel('private-channel', false)
  const view = render(<Channel />)
  fireEvent.click(view.getByText('Dialog'))
  fireEvent.click(view.getByText('Paste'))
  expect(ipcRenderer.send).toHaveBeenCalledWith('openUploadFileDialog', 'private-channel')
  expect(ipcRenderer.send).toHaveBeenCalledWith(
    'writeTempFile',
    expect.objectContaining({ channelId: 'private-channel' })
  )

  selectChannel('public-channel', true)
  view.rerender(<Channel />)
  const dialogFile = { path: '/dialog.txt', name: 'dialog', ext: '.txt' }
  const clipboardFile = { path: '/clipboard.png', name: 'clipboard', ext: '.png' }
  emitIpc('openedFiles', { dialog: dialogFile }, 'private-channel')
  emitIpc('writeTempFileReply', { ...clipboardFile, id: 'clipboard', channelId: 'private-channel' })
  fireEvent.click(view.getByText('Send'))
  expect(mockDispatch.mock.calls.some(([action]) => action.type === files.actions.attachFile.type)).toBe(false)

  fireEvent.click(view.getByText('Dialog'))
  fireEvent.click(view.getByText('Paste'))
  expect(ipcRenderer.send).toHaveBeenCalledWith('openUploadFileDialog', 'public-channel')
  expect(ipcRenderer.send).toHaveBeenCalledWith(
    'writeTempFile',
    expect.objectContaining({ channelId: 'public-channel' })
  )
  emitIpc('openedFiles', { dialog: dialogFile }, 'public-channel')
  emitIpc('writeTempFileReply', { ...clipboardFile, id: 'clipboard', channelId: 'public-channel' })
  fireEvent.click(view.getByText('Send'))
  expect(mockDispatch).toHaveBeenCalledWith(files.actions.attachFile({ ...dialogFile, channelId: 'public-channel' }))
  expect(mockDispatch).toHaveBeenCalledWith(files.actions.attachFile({ ...clipboardFile, channelId: 'public-channel' }))
})
