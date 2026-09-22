import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { prepareStore } from '../../tests/utils/prepareStore'
import { renderComponent } from '../../tests/utils/renderComponent'
import { BETA_WARNING, GetStarted } from './GetStarted.component'
import { GET_STARTED_HEADING } from '@quiet/common'

describe('GetStarted component', () => {
  it('shows the entry under an empty bar zone and routes its three rows', async () => {
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

    expect(result.getByText(GET_STARTED_HEADING)).toBeTruthy()
    expect(result.getByText(BETA_WARNING)).toBeTruthy()
    // The bar zone is reserved so this screen starts where the ones it leads to start,
    // but it carries no title and no glyph: a deliberate departure from the frame's
    // "Quiet" bar, and there is nothing to go back to from the entry.
    expect(result.getByTestId('appbar_without_title')).toBeTruthy()
    expect(result.queryByTestId('appbar_action_item')).toBeNull()
    expect(result.queryByText('Quiet')).toBeNull()

    fireEvent.press(result.getByTestId('get-started-join'))
    fireEvent.press(result.getByTestId('get-started-create'))
    fireEvent.press(result.getByTestId('get-started-link-devices'))
    expect(onJoinCommunity).toHaveBeenCalledTimes(1)
    expect(onCreateCommunity).toHaveBeenCalledTimes(1)
    expect(onLinkDevices).toHaveBeenCalledTimes(1)
  })

  it('draws the beta caption in the onboarding ink the frames use, not the caption grey', async () => {
    const { store } = await prepareStore()

    const result = renderComponent(
      <GetStarted onJoinCommunity={jest.fn()} onCreateCommunity={jest.fn()} onLinkDevices={jest.fn()} />,
      store
    )

    // `Status`, Rubik 12/16 w400 #222222 (Get started 6066:27523), as desktop draws it since #3666.
    // #999999 is the library's general caption grey and is wrong for this one line.
    expect(result.getByText(BETA_WARNING)).toHaveStyle({ color: '#222222', fontSize: 12, lineHeight: 16 })
  })
})
