import React from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { act, fireEvent } from '@testing-library/react-native'
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker'
import { communities, files, messages, publicChannels, users } from '@quiet/state-manager'
import { ChannelOperationStatus, CommunityOwnership, MessageType } from '@quiet/types'

import { ChannelScreen } from './Channel.screen'
import { allReducers } from '../../store/root.reducer'
import { initActions } from '../../store/init/init.slice'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

jest.mock('react-native-image-picker', () => ({ launchImageLibrary: jest.fn() }))

const launchImageLibraryMock = jest.mocked(launchImageLibrary)
const cachedPhoto = {
  uri: 'file:///data/user/0/com.quietmobile/cache/picker/photo.jpg',
  originalPath: '/storage/emulated/0/DCIM/original.jpg',
  fileName: 'photo.jpg',
  type: 'image/jpeg',
}

const renderChannel = () => {
  // Use the production reducers, ChannelScreen, and Chat, with no backend sagas.
  const store = configureStore({ reducer: allReducers, middleware: [] })
  store.dispatch(
    communities.actions.addNewCommunity({
      id: 'attachments-community',
      name: 'Attachments',
      teamId: 'attachments-team',
      ownership: CommunityOwnership.User,
    })
  )
  store.dispatch(communities.actions.setCurrentCommunity('attachments-community'))
  store.dispatch(users.actions.setUserProfile({ userId: 'alice', nickname: 'Alice' }))
  store.dispatch(
    publicChannels.actions.addChannel({
      status: ChannelOperationStatus.SUCCESS,
      channel: {
        id: 'general',
        name: 'general',
        description: '',
        owner: 'alice',
        timestamp: 1700000000,
        public: true,
        teamId: 'attachments-team',
      },
    })
  )
  store.dispatch(
    publicChannels.actions.cacheMessages({
      channelId: 'general',
      messages: [
        {
          id: 'welcome',
          userId: 'alice',
          channelId: 'general',
          createdAt: 1700000000,
          type: MessageType.Basic,
          message: 'Welcome',
        },
      ],
    })
  )
  store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: 'general' }))
  store.dispatch(initActions.setWebsocketConnected({ dataPort: 4677, socketIOSecret: 'test-secret' }))
  const dispatch = jest.spyOn(store, 'dispatch')
  const result = renderComponent(
    <Provider store={store}>
      <ChannelScreen />
    </Provider>
  )
  return { ...result, dispatch }
}

const respondWith = (response: ImagePickerResponse) => {
  launchImageLibraryMock.mockImplementationOnce((_options, callback) => {
    callback?.(response)
    return Promise.resolve(response)
  })
}

describe('Channel photo attachments', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    launchImageLibraryMock.mockReset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('opens the photo picker and sends its cached local URI to the backend', () => {
    respondWith({ assets: [cachedPhoto] })
    const { getByTestId, getByLabelText, queryByLabelText, dispatch } = renderChannel()

    fireEvent.press(getByTestId('attach_file_button'))

    expect(launchImageLibraryMock).toHaveBeenCalledWith(
      { presentationStyle: 'fullScreen', mediaType: 'mixed', selectionLimit: 5 },
      expect.any(Function)
    )
    expect(getByLabelText('photo').props.source.uri).toBe(cachedPhoto.uri)
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: files.actions.attachFile.type }))

    fireEvent.press(getByTestId('send_message_button'))

    expect(dispatch).toHaveBeenCalledWith(
      files.actions.attachFile({ path: cachedPhoto.uri, name: 'photo', ext: '.jpg', tmpPath: undefined })
    )
    expect(queryByLabelText('photo')).toBeNull()
  })

  it('keeps the draft and previously selected photo when another picker is cancelled', () => {
    respondWith({ assets: [cachedPhoto] })
    const { getByTestId, getByLabelText, dispatch } = renderChannel()
    fireEvent.changeText(getByTestId('input'), 'A photo for you')
    fireEvent.press(getByTestId('attach_file_button'))

    respondWith({ didCancel: true })
    fireEvent.press(getByTestId('attach_file_button'))

    expect(getByLabelText('photo').props.source.uri).toBe(cachedPhoto.uri)
    fireEvent.press(getByTestId('send_message_button'))
    act(() => jest.advanceTimersByTime(50))

    expect(dispatch).toHaveBeenCalledWith(messages.actions.sendMessage({ message: 'A photo for you' }))
    expect(dispatch).toHaveBeenCalledWith(
      files.actions.attachFile({ path: cachedPhoto.uri, name: 'photo', ext: '.jpg', tmpPath: undefined })
    )
    expect(dispatch.mock.calls.filter(([action]) => action.type === files.actions.attachFile.type)).toHaveLength(1)
  })

  it.each<ImagePickerResponse>([
    { didCancel: true },
    { errorCode: 'others', errorMessage: 'Could not copy the selected photo', assets: [cachedPhoto] },
    { assets: [] },
  ])('does not create an attachment for an unsuccessful picker response: %j', response => {
    respondWith(response)
    const { getByTestId, queryByTestId, queryByLabelText, dispatch } = renderChannel()

    fireEvent.press(getByTestId('attach_file_button'))

    expect(queryByLabelText('photo')).toBeNull()
    expect(queryByTestId('send_message_button')).toBeNull()
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: files.actions.attachFile.type }))
  })
})
