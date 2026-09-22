import React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/react'

import { communities, getReduxStoreFactory } from '@quiet/state-manager'

import { renderComponent } from '../../testUtils/renderComponent'
import { prepareStore } from '../../testUtils/prepareStore'
import SettingsComponent, { SettingsComponentProps } from './SettingsComponent'
import { LinkedDevices } from './Tabs/LinkedDevices/LinkedDevices'
import { LeaveCommunityComponent } from './Tabs/LeaveCommunity/LeaveCommunityComponent'

const CommunityMembershipTab: React.FC = () => <div data-testid='community-membership-panel' />

const LeaveCommunityTab: React.FC = () => (
  <LeaveCommunityComponent communityName='devices' leaveCommunity={jest.fn()} open={true} handleClose={jest.fn()} />
)

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
      leaveCommunity: LeaveCommunityTab,
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

  /**
   * The panels stopped printing their own heading when the bar took the title over, so the bar's
   * title has to be a heading - otherwise a panel has none at all and nothing names the dialog.
   */
  it('gives a panel whose title lives in the bar one heading, and names the dialog by it', async () => {
    const result = await renderSettings()
    fireEvent.click(result.getByTestId('leave-community-settings-tab'))

    // Exactly one heading, and it is the row's title.
    const headings = result.getAllByRole('heading')
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent('Leave community')

    // The panel's content is there under it, so this is the open tab and not the menu.
    expect(result.getByTestId('leave-community-button')).toBeVisible()

    // The panel is the dialog, and it takes its name from that heading.
    const dialog = result.getByRole('dialog')
    expect(headings[0].getAttribute('id')).toBeTruthy()
    expect(dialog).toHaveAttribute('aria-labelledby', headings[0].getAttribute('id'))
    expect(dialog).toContainElement(headings[0])
    expect(dialog).toHaveAccessibleName('Leave community')
  })

  /** The menu itself is a panel too, and it is what the dialog opens on. */
  it('names the dialog by the menu heading before a row is chosen', async () => {
    const result = await renderSettings()

    const headings = result.getAllByRole('heading')
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent('Community Settings')
    expect(result.getByRole('dialog')).toHaveAccessibleName('Community Settings')
  })

  /**
   * Linked devices keeps its heading in the panel, so the bar draws none - and an empty heading
   * would be worse than no heading. The dialog names itself with the row's words instead.
   */
  it('draws no empty bar heading for a panel that prints its own, and still names the dialog', async () => {
    const result = await renderSettings()
    fireEvent.click(result.getByTestId('linked-devices-settings-tab'))

    for (const heading of result.getAllByRole('heading')) {
      expect(heading.textContent).not.toBe('')
    }
    expect(result.getByRole('dialog')).toHaveAccessibleName('Linked devices')
  })
})
