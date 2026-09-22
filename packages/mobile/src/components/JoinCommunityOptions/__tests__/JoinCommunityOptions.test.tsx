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
        onRecoverAccount={jest.fn()}
        handleBackButton={jest.fn()}
      />
    )
    expect(getByTestId('join-community-graphic').props.style).toMatchObject(GRAPHIC_SIZE)
    expect(toJSON()).toMatchSnapshot()
  })

  // All three rows route now: #3514 gave Recover account a screen, so the row that used to be
  // present but disabled is live and hands over to Account recovery (2811:2535).
  it('routes all three rows', () => {
    const onJoinWithInviteLink = jest.fn()
    const onJoinWithQrCode = jest.fn()
    const onRecoverAccount = jest.fn()
    const { getByTestId } = renderComponent(
      <JoinCommunityOptions
        onJoinWithInviteLink={onJoinWithInviteLink}
        onJoinWithQrCode={onJoinWithQrCode}
        onRecoverAccount={onRecoverAccount}
        handleBackButton={jest.fn()}
      />
    )
    fireEvent.press(getByTestId('join-with-invite-link'))
    fireEvent.press(getByTestId('join-with-qr-code'))
    fireEvent.press(getByTestId('recover-account'))
    expect(onJoinWithInviteLink).toHaveBeenCalledTimes(1)
    expect(onJoinWithQrCode).toHaveBeenCalledTimes(1)
    expect(onRecoverAccount).toHaveBeenCalledTimes(1)
  })
})
