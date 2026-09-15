import React from 'react'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SettingsComponent } from './SettingsComponent'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const noOp = jest.fn()

const mockLeaveCommunityModal = {
  open: false,
  handleOpen: jest.fn(),
  handleClose: jest.fn(),
}

const MockTab: React.FC<{ handleClose: () => void }> = ({ handleClose }) => (
  <div data-testid='mock-tab-content'>
    <p>Tab content</p>
    <button onClick={handleClose}>Close from tab</button>
  </div>
)

const defaultTabs: Record<string, React.FC<{ handleClose: () => void }>> = {
  about: MockTab,
  notifications: MockTab,
  attachments: MockTab,
  invite: MockTab,
  qrcode: MockTab,
  leaveCommunity: MockTab,
  debug: MockTab,
}

function renderSettings(overrides: Partial<React.ComponentProps<typeof SettingsComponent>> = {}) {
  return render(
    <SettingsComponent
      open={true}
      handleClose={noOp}
      tabs={defaultTabs}
      leaveCommunityModal={mockLeaveCommunityModal}
      {...overrides}
    />
  )
}

// Click a menu item and wait for the tab drawer to fully mount.
// MUI Drawer only inserts children into the DOM when open=true, so we must
// wait after the state-updating click before querying the second drawer.
async function openTab(testId: string) {
  fireEvent.click(screen.getByTestId(testId))
  return screen.findByTestId('ArrowBackIcon') // resolves once drawer is mounted
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SettingsComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('main drawer', () => {
    it('renders the "Community Settings" heading when open', () => {
      renderSettings()
      expect(screen.getByText('Community Settings')).toBeInTheDocument()
    })

    it('renders all expected menu items', () => {
      renderSettings()
      expect(screen.getByTestId('about-settings-tab')).toBeInTheDocument()
      expect(screen.getByTestId('notifications-settings-tab')).toBeInTheDocument()
      expect(screen.getByTestId('attachments-settings-tab')).toBeInTheDocument()
      expect(screen.getByTestId('invite-settings-tab')).toBeInTheDocument()
      expect(screen.getByTestId('qr-code-settings-tab')).toBeInTheDocument()
    })

    it('calls handleClose when the close button is clicked', () => {
      const handleClose = jest.fn()
      renderSettings({ handleClose })
      fireEvent.click(screen.getByTestId('CloseIcon'))
      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  // ── Tab drawer – issue #2568 regression ───────────────────────────────────

  describe('issue #2568 – tab title in top bar, not in content area', () => {
    /**
     * When a tab is opened the title must appear inside the header ListItem
     * (the element that also contains the back-arrow button), NOT inside the
     * scrollable content area below the divider.
     *
     * Both drawers stay in the DOM simultaneously once the tab is open, so
     * some title strings (e.g. "Notifications") appear twice – once as a menu
     * item in drawer 1 and once as the header title in drawer 2. We therefore
     * scope every assertion to the specific container.
     */
    it.each([
      ['about', 'About Quiet'],
      ['notifications', 'Notifications'],
      ['attachments', 'Files and Images'],
      ['invite', 'Add Members'],
      ['qr-code', 'QR Code'],
    ])('"%s" tab shows "%s" in the header bar', async (testId, expectedTitle) => {
      renderSettings()

      // openTab uses fireEvent + findByTestId (async) to wait for the second
      // drawer to mount – fireEvent reliably triggers MUI's onClick handlers.
      const backButton = await openTab(`${testId}-settings-tab`)

      // The title must be inside the same ListItem as the back button (= the header bar)
      const headerListItem = backButton.closest('li') as HTMLElement
      expect(headerListItem).not.toBeNull()
      expect(within(headerListItem).getByText(expectedTitle)).toBeInTheDocument()

      // The scrollable content area must NOT contain the title
      const tabContent = screen.getByTestId('mock-tab-content')
      expect(within(tabContent).queryByText(expectedTitle)).not.toBeInTheDocument()
    })
  })

  // ── Tab navigation ────────────────────────────────────────────────────────

  describe('tab navigation', () => {
    it('opens the tab drawer when a menu item is clicked', async () => {
      renderSettings()
      expect(screen.queryByTestId('close-tab-button-box')).not.toBeInTheDocument()

      await openTab('notifications-settings-tab')

      expect(screen.getByTestId('ArrowBackIcon')).toBeInTheDocument()
    })

    it('renders the tab component content after opening a tab', async () => {
      renderSettings()
      await openTab('about-settings-tab')

      expect(screen.getByTestId('mock-tab-content')).toBeInTheDocument()
    })

    it('closes the tab drawer when the back button is clicked', async () => {
      renderSettings()
      const backButton = await openTab('notifications-settings-tab')

      fireEvent.click(backButton)

      await waitFor(() => {
        expect(screen.queryByTestId('close-tab-button-box')).not.toBeInTheDocument()
      })
    })

    it('closes the tab drawer when the tab itself calls handleClose', async () => {
      renderSettings()
      await openTab('notifications-settings-tab')

      fireEvent.click(screen.getByText('Close from tab'))

      await waitFor(() => {
        expect(screen.queryByTestId('mock-tab-content')).not.toBeInTheDocument()
      })
    })

    it('shows the correct title when switching between tabs', async () => {
      renderSettings()

      // Open notifications and verify its title is in the header
      const backButton1 = await openTab('notifications-settings-tab')
      const header1 = backButton1.closest('li') as HTMLElement
      expect(within(header1).getByText('Notifications')).toBeInTheDocument()

      // Go back to the main menu
      fireEvent.click(backButton1)
      await waitFor(() => {
        expect(screen.queryByTestId('close-tab-button-box')).not.toBeInTheDocument()
      })

      // Open attachments and verify its title
      const backButton2 = await openTab('attachments-settings-tab')
      const header2 = backButton2.closest('li') as HTMLElement
      expect(within(header2).getByText('Files and Images')).toBeInTheDocument()
    })
  })

  // ── isWindows prop ────────────────────────────────────────────────────────

  describe('isWindows prop', () => {
    it('hides the "Leave community" item on Windows', () => {
      renderSettings({ isWindows: true })
      expect(screen.queryByTestId('leave-community-settings-tab')).not.toBeInTheDocument()
    })

    it('shows the "Leave community" item on non-Windows platforms', () => {
      renderSettings({ isWindows: false })
      expect(screen.getByTestId('leave-community-settings-tab')).toBeInTheDocument()
    })

    it('shows the "Leave community" item when isWindows is undefined', () => {
      renderSettings({ isWindows: undefined })
      expect(screen.getByTestId('leave-community-settings-tab')).toBeInTheDocument()
    })
  })

  // ── Debug tab (environment-gated) ─────────────────────────────────────────

  describe('debug tab', () => {
    const originalEnv = process.env

    afterEach(() => {
      process.env = { ...originalEnv }
    })

    it('shows the debug tab in development mode', () => {
      process.env = { ...originalEnv, NODE_ENV: 'development' }
      renderSettings()
      expect(screen.getByTestId('debug-settings-tab')).toBeInTheDocument()
    })

    it('shows the debug tab when IS_E2E is "true"', () => {
      process.env = { ...originalEnv, NODE_ENV: 'production', IS_E2E: 'true' }
      renderSettings()
      expect(screen.getByTestId('debug-settings-tab')).toBeInTheDocument()
    })

    it('hides the debug tab in production without IS_E2E', () => {
      process.env = { ...originalEnv, NODE_ENV: 'production', IS_E2E: undefined }
      renderSettings()
      expect(screen.queryByTestId('debug-settings-tab')).not.toBeInTheDocument()
    })
  })

  // ── Closed state ──────────────────────────────────────────────────────────

  describe('closed state', () => {
    it('does not mount main drawer content when open is false', () => {
      // MUI Drawer unmounts its children when open=false (no keepMounted),
      // so queryByText returns null rather than a hidden element.
      renderSettings({ open: false })
      expect(screen.getByText('Community Settings')).not.toBeVisible()
    })
  })
})
