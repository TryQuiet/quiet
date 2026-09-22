import React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/react'

import { communities, getReduxStoreFactory } from '@quiet/state-manager'

import { renderComponent } from '../../testUtils/renderComponent'
import { prepareStore } from '../../testUtils/prepareStore'
import SettingsComponent, { SettingsComponentProps } from './SettingsComponent'
import { LinkedDevices } from './Tabs/LinkedDevices/LinkedDevices'

const CommunityMembershipTab: React.FC = () => <div data-testid='community-membership-panel' />

/**
 * The Linked devices tab is the real one, not a stand-in: what the bar does depends on the panel
 * printing its own heading, so a stub would decide the answer.
 */
const renderSettings = async () => {
  const { store } = await prepareStore()
  const factory = await getReduxStoreFactory(store)
  const community = await factory.create('Community', { name: 'devices' })
  store.dispatch(communities.actions.setCurrentCommunity(community.id))

  const props: SettingsComponentProps = {
    open: true,
    handleClose: jest.fn(),
    tabs: {
      linkedDevices: LinkedDevices,
      communityMembership: CommunityMembershipTab,
    },
    leaveCommunityModal: {
      open: false,
      handleOpen: jest.fn(),
      handleClose: jest.fn(),
    },
  }
  return renderComponent(<SettingsComponent {...props} />, store)
}

describe('SettingsComponent', () => {
  /**
   * The menu row and its e2e id: develop's deviceLinking tests resolve the tab as
   * //div[@data-testid='linked-devices-settings-tab'], which is the id PanelRow prints verbatim.
   */
  it('offers Linked devices in the community menu', async () => {
    const result = await renderSettings()
    expect(result.getByTestId('linked-devices-settings-tab')).toBeVisible()
    // Our own membership tab is still there beside it.
    expect(result.getByTestId('community-membership-settings-tab')).toBeVisible()
  })

  it('opens the Link devices content from that row', async () => {
    const result = await renderSettings()
    fireEvent.click(result.getByTestId('linked-devices-settings-tab'))

    expect(result.getByTestId('link-devices')).toBeVisible()
    expect(result.getByText('Link devices')).toBeVisible()
    // Inside a community the tab shares: the QR code and the link, not the receive rows.
    expect(result.getByTestId('link-devices-display-qr')).toBeVisible()
    expect(result.getByTestId('link-devices-copy-link')).toBeVisible()
    expect(result.queryByTestId('link-devices-scan-qr')).toBeNull()
  })

  it('does not repeat the heading in the bar for a panel that prints its own', async () => {
    const result = await renderSettings()
    fireEvent.click(result.getByTestId('linked-devices-settings-tab'))

    // The panel's own heading is the only one on screen; the bar prints nothing beside it.
    expect(result.getAllByText('Link devices')).toHaveLength(1)
    expect(result.queryByText('Linked devices')).toBeNull()
    // The bar itself is still there, with its back control.
    expect(result.getByTestId('close-tab-button-box')).toBeVisible()
  })
})
