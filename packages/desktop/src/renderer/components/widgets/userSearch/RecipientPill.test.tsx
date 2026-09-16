import React from 'react'
import '@testing-library/jest-dom'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { UserProfile } from '@quiet/types'

import { renderComponent } from '../../../testUtils/renderComponent'
import UserSearchAutocomplete from './UserSearchAutoComplete'

/**
 * Picking a recipient has to produce a design pill — a thumbnail, the nickname and a control that
 * takes it back out again. MUI's own Chip renders none of the first and a different second, so this
 * covers the renderTags override rather than the pill's own styling.
 */
const userProfiles: Record<string, UserProfile> = {
  deniseUserId: {
    userId: 'deniseUserId',
    nickname: 'denise',
    userData: { peerId: 'denisePeerId', onionAddress: 'denise.onion' },
    channels: [],
  },
  gordonUserId: {
    userId: 'gordonUserId',
    nickname: 'gordon',
    userData: { peerId: 'gordonPeerId', onionAddress: 'gordon.onion' },
    channels: [],
  },
}

describe('Recipient pills', () => {
  it('turns a picked member into a pill with a thumbnail, and takes it back out again', async () => {
    const handleInputChange = jest.fn()
    renderComponent(
      <UserSearchAutocomplete
        userProfiles={userProfiles}
        me={userProfiles.deniseUserId}
        placeholderText='Search for members or chats'
        handleInputChange={handleInputChange}
      />
    )

    await userEvent.click(screen.getByPlaceholderText('Search for members or chats'))
    await userEvent.click(await screen.findByTestId('new-message-add-members-autocomplete-option-gordon'))

    const pill = await screen.findByTestId('new-message-recipient-pill-gordon')
    expect(pill).toBeVisible()
    // Always a thumbnail: gordon has no photo, so this is the Jdenticon standing in for one.
    expect(pill.querySelector('svg, img')).not.toBeNull()

    await userEvent.click(screen.getByTestId('new-message-recipient-pill-remove-gordon'))
    expect(screen.queryByTestId('new-message-recipient-pill-gordon')).toBeNull()
  })
})
