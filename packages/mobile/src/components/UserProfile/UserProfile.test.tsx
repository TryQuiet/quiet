import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { UserProfile } from '@quiet/types'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { UserProfileComponent } from './UserProfile.component'

describe('UserProfileComponent', () => {
  const profile: UserProfile = { userId: 'u-1', nickname: 'denise' }

  const renderProfile = (isMe = false, handleMessage = jest.fn(), handleEditPhoto = jest.fn()) => ({
    handleMessage,
    handleEditPhoto,
    ...renderComponent(
      <UserProfileComponent
        profile={profile}
        isMe={isMe}
        handleBackButton={jest.fn()}
        handleMessage={handleMessage}
        handleEditPhoto={handleEditPhoto}
      />
    ),
  })

  it('shows the photo and the name', () => {
    const { queryByText, queryByTestId } = renderProfile()

    expect(queryByText('denise')).not.toBeNull()
    expect(queryByTestId('user-profile-component-u-1')).not.toBeNull()
  })

  it('offers Message, and hands over when it is pressed', () => {
    const { queryByTestId, handleMessage } = renderProfile()

    const button = queryByTestId('user-profile-message-button')
    expect(button).not.toBeNull()
    fireEvent.press(button!)
    expect(handleMessage).toHaveBeenCalled()
  })

  // A DM with just yourself is an ordinary conversation in Quiet, so the button stays as it is —
  // no separate "note to self" affordance.
  it('keeps the ordinary Message button on your own profile', () => {
    const { queryByTestId, handleMessage } = renderProfile(true)

    const button = queryByTestId('user-profile-message-button')
    expect(button).not.toBeNull()
    fireEvent.press(button!)
    expect(handleMessage).toHaveBeenCalled()
  })

  it('lets you change your own photo, and hands over when the control is pressed', () => {
    const { queryByTestId, handleEditPhoto } = renderProfile(true)

    const edit = queryByTestId('user-profile-edit-photo')
    expect(edit).not.toBeNull()
    fireEvent.press(edit!)
    expect(handleEditPhoto).toHaveBeenCalled()
  })

  it("offers no way to change somebody else's photo", () => {
    const { queryByTestId } = renderProfile(false)

    expect(queryByTestId('user-profile-edit-photo')).toBeNull()
  })

  it('renders nothing for a profile that has not replicated yet', () => {
    const { toJSON } = renderComponent(
      <UserProfileComponent
        profile={undefined}
        isMe={false}
        handleBackButton={jest.fn()}
        handleMessage={jest.fn()}
      />
    )

    expect(toJSON()).toBeNull()
  })
})
