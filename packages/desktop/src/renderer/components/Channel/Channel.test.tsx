import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { files, messages, publicChannels } from '@quiet/state-manager'
import Channel from './Channel'
import { type ChannelComponentProps } from './ChannelComponent'

const mockDispatch = jest.fn()
const mockSelections = new Map()

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: unknown) => mockSelections.get(selector),
}))
jest.mock('electron', () => ({
  ipcRenderer: { on: jest.fn() },
  webUtils: { getPathForFile: (file: { path: string }) => file.path },
}))
jest.mock('../../containers/hooks', () => ({ useModal: () => ({}) }))
jest.mock('../../../hooks/useContextMenu', () => ({ useContextMenu: () => ({}) }))
jest.mock('./ChannelComponent', () => ({
  __esModule: true,
  default: ({ onInputEnter, handleFileDrop }: Pick<ChannelComponentProps, 'onInputEnter' | 'handleFileDrop'>) => (
    <>
      <button onClick={() => handleFileDrop({ files: [{ path: '/file.txt' }] })}>Attach</button>
      <button onClick={() => onInputEnter('message')}>Send</button>
    </>
  ),
}))

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
