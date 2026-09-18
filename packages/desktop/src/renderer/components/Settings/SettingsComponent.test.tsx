import React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/react'

import { renderComponent } from '../../testUtils/renderComponent'
import SettingsComponent, { SettingsComponentProps } from './SettingsComponent'
import { LinkedDevicesComponent } from './Tabs/LinkedDevices/LinkedDevices.component'

const LinkedDevicesTab: React.FC = () => (
  <LinkedDevicesComponent
    deviceLink='https://tryquiet.org/join#device-link'
    isLoading={false}
    revealLink={false}
    onToggleLinkVisibility={jest.fn()}
  />
)

const CommunityMembershipTab: React.FC = () => <div data-testid='community-membership-panel' />

const renderSettings = () => {
  const props: SettingsComponentProps = {
    open: true,
    handleClose: jest.fn(),
    tabs: {
      linkedDevices: LinkedDevicesTab,
      communityMembership: CommunityMembershipTab,
    },
    leaveCommunityModal: {
      open: false,
      handleOpen: jest.fn(),
      handleClose: jest.fn(),
    },
  }
  return renderComponent(<SettingsComponent {...props} />)
}

describe('SettingsComponent', () => {
  /**
   * The menu row and its e2e id: develop's deviceLinking tests resolve the tab as
   * //div[@data-testid='linked-devices-settings-tab'], which is the id PanelRow prints verbatim.
   */
  it('offers Linked devices in the community menu', () => {
    const result = renderSettings()
    expect(result.getByTestId('linked-devices-settings-tab')).toBeVisible()
    // Our own membership tab is still there beside it.
    expect(result.getByTestId('community-membership-settings-tab')).toBeVisible()
  })

  it('opens the Linked devices tab from that row', () => {
    const result = renderSettings()
    fireEvent.click(result.getByTestId('linked-devices-settings-tab'))
    expect(result.getByTestId('linked-devices-title')).toBeVisible()
    expect(result.getByText('Link a new device')).toBeVisible()
  })

  it('does not repeat the heading in the bar for a panel that prints its own', () => {
    const result = renderSettings()
    fireEvent.click(result.getByTestId('linked-devices-settings-tab'))
    // The panel's h3 is the only "Linked devices" on screen once the tab is open.
    expect(result.getAllByText('Linked devices')).toHaveLength(1)
    // The bar itself is still there, with its back control.
    expect(result.getByTestId('close-tab-button-box')).toBeVisible()
  })
})
