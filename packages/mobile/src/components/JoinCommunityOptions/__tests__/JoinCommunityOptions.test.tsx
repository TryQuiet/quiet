import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { renderComponent } from '../../../utils/functions/renderComponent/renderComponent'
import { GRAPHIC_SIZE, JoinCommunityOptions } from '../JoinCommunityOptions.component'

describe('JoinCommunityOptions component', () => {
  it('renders the heart-chat graphic above the title at the frame size', () => {
    const { toJSON, getByTestId } = renderComponent(
      <JoinCommunityOptions
        onJoinWithInviteLink={jest.fn()}
        onJoinWithQrCode={jest.fn()}
        handleBackButton={jest.fn()}
      />
    )
    expect(getByTestId('join-community-graphic').props.style).toMatchObject(GRAPHIC_SIZE)
    expect(toJSON()).toMatchSnapshot()
  })

  it('routes the two enabled rows and keeps Recover account disabled', () => {
    const onJoinWithInviteLink = jest.fn()
    const onJoinWithQrCode = jest.fn()
    const { getByTestId } = renderComponent(
      <JoinCommunityOptions
        onJoinWithInviteLink={onJoinWithInviteLink}
        onJoinWithQrCode={onJoinWithQrCode}
        handleBackButton={jest.fn()}
      />
    )
    fireEvent.press(getByTestId('join-with-invite-link'))
    fireEvent.press(getByTestId('join-with-qr-code'))
    expect(onJoinWithInviteLink).toHaveBeenCalledTimes(1)
    expect(onJoinWithQrCode).toHaveBeenCalledTimes(1)
    expect(getByTestId('recover-account').props.accessibilityState).toEqual({ disabled: true })
  })
})
