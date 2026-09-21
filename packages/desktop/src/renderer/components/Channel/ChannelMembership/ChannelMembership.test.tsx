import React from 'react'
import '@testing-library/jest-dom'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { UserProfile } from '@quiet/types'

import { renderComponent } from '../../../testUtils/renderComponent'
import ChannelMembershipComponent from './ChannelMembershipComponent'

/**
 * The step between the channel menu and Add members. Covers what the panel promises rather than
 * its markup: it names the conversation the way the rest of the app does, it lists who belongs,
 * and it offers the way to add more only to someone who may add.
 */
const profile = (nickname: string): UserProfile => ({
  userId: `${nickname}UserId`,
  nickname,
  channels: [],
})

const members = [profile('denise'), profile('gordon')]

const renderPanel = (overrides: Partial<React.ComponentProps<typeof ChannelMembershipComponent>> = {}) => {
  const openAddMembers = jest.fn()
  const handleClose = jest.fn()
  renderComponent(
    <ChannelMembershipComponent
      channelName='fundraising'
      isDm={false}
      members={members}
      isUserConnected={() => false}
      isTorInitialized={true}
      canManage={true}
      openAddMembers={openAddMembers}
      open={true}
      handleOpen={jest.fn()}
      handleClose={handleClose}
      {...overrides}
    />
  )
  return { openAddMembers, handleClose }
}

describe('ChannelMembership', () => {
  it('titles itself Members and names the channel it belongs to, with its "#"', () => {
    renderPanel()
    expect(screen.getByTestId('channelMembershipPanelTitle')).toHaveTextContent('Members')
    expect(screen.getByText('#fundraising')).toBeVisible()
  })

  it("does not repeat a DM's participants above the list of those same participants", () => {
    renderPanel({ isDm: true, channelName: 'denise, gordon' })
    expect(screen.getByTestId('channelMembershipPanelTitle')).toHaveTextContent('Members')
    // The rows below are denise and gordon; a subtitle saying "denise, gordon" said it twice.
    expect(screen.queryByText('denise, gordon')).toBeNull()
    expect(screen.queryByText('#denise, gordon')).toBeNull()
  })

  it('lists who belongs', () => {
    renderPanel()
    expect(screen.getByTestId('channelMembershipRow-denise')).toBeVisible()
    expect(screen.getByTestId('channelMembershipRow-gordon')).toBeVisible()
  })

  it('offers Add members to someone who may add, and hands over when it is pressed', async () => {
    const { openAddMembers } = renderPanel()

    await userEvent.click(screen.getByTestId('channelMembershipAddMembers'))
    expect(openAddMembers).toHaveBeenCalled()
  })

  it('shows no way to add to someone who may not', () => {
    renderPanel({ canManage: false })
    expect(screen.queryByTestId('channelMembershipAddMembers')).toBeNull()
    expect(screen.getByTestId('channelMembershipRow-denise')).toBeVisible()
  })

  it('says so when nobody has been added yet', () => {
    renderPanel({ members: [] })
    expect(screen.getByTestId('channelMembershipEmpty')).toBeVisible()
  })

  it('leaves by its back arrow without changing anything', async () => {
    const { handleClose, openAddMembers } = renderPanel()

    await userEvent.click(screen.getByTestId('channelMembershipPanelClose'))
    expect(handleClose).toHaveBeenCalled()
    expect(openAddMembers).not.toHaveBeenCalled()
  })
  /**
   * The list shows me alongside everybody else, and I am not my own peer, so my row cannot be
   * answered by remote presence. Reading it that way showed the current user offline while they
   * were using the app.
   */
  describe('presence', () => {
    const badgeClass = (nickname: string) => screen.getByTestId(`${nickname}-profile-photo-status-badge`).className

    it('lights my own row from Tor, not from a peer connection', () => {
      renderPanel({ members: [profile('denise'), profile('me')], myUserId: 'meUserId', isUserConnected: () => false })
      expect(badgeClass('me')).not.toContain('MuiBadge-invisible')
      expect(badgeClass('denise')).toContain('MuiBadge-invisible')
    })

    it('darkens my own row while Tor is down, even if others are up', () => {
      renderPanel({
        members: [profile('denise'), profile('me')],
        myUserId: 'meUserId',
        isTorInitialized: false,
        isUserConnected: userId => userId === 'deniseUserId',
      })
      expect(badgeClass('me')).toContain('MuiBadge-invisible')
      expect(badgeClass('denise')).not.toContain('MuiBadge-invisible')
    })
  })
})
