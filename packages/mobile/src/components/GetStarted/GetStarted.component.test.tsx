import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { BETA_WARNING, GetStarted } from './GetStarted.component'

describe('GetStarted component', () => {
  it('shows the entry without an app bar and routes its three rows', async () => {
    const { store } = await prepareStore()
    const onJoinCommunity = jest.fn()
    const onCreateCommunity = jest.fn()
    const onLinkDevices = jest.fn()

    const result = renderComponent(
      <GetStarted
        onJoinCommunity={onJoinCommunity}
        onCreateCommunity={onCreateCommunity}
        onLinkDevices={onLinkDevices}
      />,
      store
    )

    expect(result.getByText('Let’s get started...')).toBeTruthy()
    expect(result.getByText(BETA_WARNING)).toBeTruthy()
    // No app bar on Get started (a deliberate departure from the frame's "Quiet" bar)
    expect(result.queryByTestId('appbar_action_item')).toBeNull()
    expect(result.queryByText('Quiet')).toBeNull()

    fireEvent.press(result.getByTestId('get-started-join'))
    fireEvent.press(result.getByTestId('get-started-create'))
    fireEvent.press(result.getByTestId('get-started-link-devices'))
    expect(onJoinCommunity).toHaveBeenCalledTimes(1)
    expect(onCreateCommunity).toHaveBeenCalledTimes(1)
    expect(onLinkDevices).toHaveBeenCalledTimes(1)
  })
})
