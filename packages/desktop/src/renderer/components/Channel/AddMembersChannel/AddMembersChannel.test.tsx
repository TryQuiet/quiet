import React from 'react'
import '@testing-library/jest-dom'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { User, UserProfile } from '@quiet/types'

import { renderComponent } from '../../../testUtils/renderComponent'
import AddMembersChannelComponent from './AddMembersChannelComponent'

/**
 * The second step of setting up a private channel. Covers what the design asks of it rather than
 * its markup: people picked become pills, the bar confirms with Done and cancels with the close,
 * and members already in the channel are not offered again.
 */
const profile = (nickname: string, channels: string[] = []): UserProfile => ({
  userId: `${nickname}UserId`,
  nickname,
  userData: { peerId: `${nickname}PeerId`, onionAddress: `${nickname}.onion` },
  channels,
})

const possibleMembers: Record<string, UserProfile> = {
  deniseUserId: profile('denise'),
  gordonUserId: profile('gordon'),
  annabelleUserId: profile('annabelle', ['foobar']),
}

const allUsers: Record<string, User> = {}

const renderPanel = (overrides: Partial<React.ComponentProps<typeof AddMembersChannelComponent>> = {}) => {
  const addMembersToChannel = jest.fn()
  const handleClose = jest.fn()
  renderComponent(
    <AddMembersChannelComponent
      channelName='fundraising'
      channelId='foobar'
      allUsers={allUsers}
      possibleMembers={possibleMembers}
      addMembersToChannel={addMembersToChannel}
      open={true}
      handleOpen={jest.fn()}
      handleClose={handleClose}
      {...overrides}
    />
  )
  return { addMembersToChannel, handleClose }
}

describe('AddMembersChannel', () => {
  it('names the channel it is acting on', () => {
    renderPanel()
    expect(screen.getByTestId('addMembersPanelTitle')).toHaveTextContent('Add members or roles')
    expect(screen.getByText('#fundraising')).toBeVisible()
  })

  it('does not offer members who are in the channel already', () => {
    renderPanel()
    expect(screen.getByTestId('fundraising-add-members-row-denise')).toBeVisible()
    expect(screen.queryByTestId('fundraising-add-members-row-annabelle')).toBeNull()
  })

  it('turns a picked member into a pill and hands the picks to Done', async () => {
    const { addMembersToChannel } = renderPanel()

    await userEvent.click(screen.getByTestId('fundraising-add-members-row-denise'))
    expect(await screen.findByTestId('new-message-recipient-pill-denise')).toBeVisible()

    await userEvent.click(screen.getByTestId('fundraising-add-members-button'))
    expect(addMembersToChannel).toHaveBeenCalledWith(['deniseUserId'])
  })

  it('takes a member back out again from the pill', async () => {
    renderPanel()

    await userEvent.click(screen.getByTestId('fundraising-add-members-row-gordon'))
    expect(await screen.findByTestId('new-message-recipient-pill-gordon')).toBeVisible()

    await userEvent.click(screen.getByTestId('new-message-recipient-pill-remove-gordon'))
    expect(screen.queryByTestId('new-message-recipient-pill-gordon')).toBeNull()
  })

  it('cannot confirm with nothing picked, and the close cancels', async () => {
    const { addMembersToChannel, handleClose } = renderPanel()

    expect(screen.getByTestId('fundraising-add-members-button')).toBeDisabled()

    await userEvent.click(screen.getByTestId('fundraising-add-members-leave-button'))
    expect(handleClose).toHaveBeenCalled()
    expect(addMembersToChannel).not.toHaveBeenCalled()
  })

  it('says so when everyone is already in the channel', () => {
    renderPanel({
      possibleMembers: {
        deniseUserId: profile('denise', ['foobar']),
        gordonUserId: profile('gordon', ['foobar']),
      },
    })
    expect(screen.getByTestId('fundraising-add-members-empty')).toBeVisible()
  })
})
