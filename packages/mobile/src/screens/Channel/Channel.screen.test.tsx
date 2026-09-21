import React from 'react'
import { act, fireEvent } from '@testing-library/react-native'
import { Keyboard } from 'react-native'
import { launchImageLibrary } from 'react-native-image-picker'
import { communities, errors, files, messages, publicChannels, users } from '@quiet/state-manager'
import { type PublicChannel } from '@quiet/types'
import { ChannelScreen } from './Channel.screen'
import { initSelectors } from '../../store/init/init.selectors'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

const mockDispatch = jest.fn()
const mockSelections = new Map()
let mockKeyboardDidShow: () => void

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: unknown) => mockSelections.get(selector),
}))
jest.mock('../../hooks/useContextMenu', () => ({
  useContextMenu: () => null,
}))
jest.mock('react-native-image-picker', () => ({ launchImageLibrary: jest.fn() }))

describe('channel composer send context', () => {
  const privateChannel: PublicChannel = {
    id: 'private-channel',
    name: 'same-name',
    owner: 'alice',
    description: '',
    timestamp: 0,
    public: false,
    roleName: 'private-role',
  }
  const publicChannel: PublicChannel = { ...privateChannel, id: 'public-channel', public: true, roleName: undefined }

  beforeEach(() => {
    jest.useFakeTimers()
    mockDispatch.mockClear()
    mockSelections.clear()
    mockSelections.set(errors.selectors.currentCommunityErrors, {})
    mockSelections.set(users.selectors.userProfiles, {})
    mockSelections.set(publicChannels.selectors.currentChannel, privateChannel)
    mockSelections.set(publicChannels.selectors.currentChannelId, privateChannel.id)
    mockSelections.set(publicChannels.selectors.currentChannelName, privateChannel.name)
    mockSelections.set(publicChannels.selectors.currentChannelMessagesCount, 1)
    mockSelections.set(publicChannels.selectors.currentChannelMessagesMergedBySender, {})
    mockSelections.set(initSelectors.isWebsocketConnected, true)
    mockSelections.set(communities.selectors.isOwner, true)
    jest.spyOn(Keyboard, 'addListener').mockImplementation((event, listener) => {
      if (event === 'keyboardDidShow') mockKeyboardDidShow = listener as () => void
      return { remove: jest.fn() } as unknown as ReturnType<typeof Keyboard.addListener>
    })
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  const attachImage = (view: ReturnType<typeof renderComponent>, name: string) => {
    const mockImageLibrary = launchImageLibrary as jest.Mock
    mockImageLibrary.mockImplementationOnce((_options, callback) => {
      callback({ assets: [{ uri: `file:///${name}.png` }] })
    })
    fireEvent.press(view.getByTestId('attach_file_button'))
  }

  const sentActions = () =>
    mockDispatch.mock.calls.map(([action]) => action).filter(action => messages.actions.sendMessage.match(action))
  const attachedActions = () =>
    mockDispatch.mock.calls.map(([action]) => action).filter(action => files.actions.attachFile.match(action))

  it('discards transient text and attachments when switching private to public with the same name', () => {
    const view = renderComponent(<ChannelScreen />)
    const privateInput = view.getByTestId('input')
    fireEvent.changeText(privateInput, 'private draft')
    attachImage(view, 'private-file')

    mockSelections.set(publicChannels.selectors.currentChannel, publicChannel)
    mockSelections.set(publicChannels.selectors.currentChannelId, publicChannel.id)
    mockSelections.set(publicChannels.selectors.currentChannelName, publicChannel.name)
    view.rerender(<ChannelScreen />)
    act(() => mockKeyboardDidShow())

    expect(view.getByTestId('input')).not.toBe(privateInput)
    fireEvent.press(view.getByTestId('send_message_button'))
    act(() => jest.advanceTimersByTime(50))

    expect(sentActions()).toEqual([])
    expect(attachedActions()).toEqual([])
  })

  it('keeps a delayed send with its original text, files and channel without clearing the new composer', () => {
    const view = renderComponent(<ChannelScreen />)
    fireEvent.changeText(view.getByTestId('input'), 'private message')
    attachImage(view, 'private-file')
    fireEvent.press(view.getByTestId('send_message_button'))

    mockSelections.set(publicChannels.selectors.currentChannel, publicChannel)
    mockSelections.set(publicChannels.selectors.currentChannelId, publicChannel.id)
    mockSelections.set(publicChannels.selectors.currentChannelName, publicChannel.name)
    view.rerender(<ChannelScreen />)
    fireEvent.changeText(view.getByTestId('input'), 'public message')
    attachImage(view, 'public-file')
    act(() => jest.advanceTimersByTime(50))

    expect(sentActions()).toEqual([
      messages.actions.sendMessage({ message: 'private message', channelId: privateChannel.id }),
    ])
    expect(attachedActions()).toEqual([
      files.actions.attachFile({
        path: 'file:///private-file.png',
        name: 'private-file',
        ext: '.png',
        channelId: privateChannel.id,
      }),
    ])

    fireEvent.press(view.getByTestId('send_message_button'))
    act(() => jest.advanceTimersByTime(50))
    expect(sentActions()[1]).toEqual(
      messages.actions.sendMessage({ message: 'public message', channelId: publicChannel.id })
    )
    expect(attachedActions()[1]).toEqual(
      files.actions.attachFile({
        path: 'file:///public-file.png',
        name: 'public-file',
        ext: '.png',
        channelId: publicChannel.id,
      })
    )
  })
})
