import React, { useEffect, useId, useRef, useState } from 'react'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import { useModal } from '../../containers/hooks'
import PanelHeader, { PANEL_WIDTH } from '../ui/Panel/PanelHeader'
import { Box, Drawer, List } from '../ui'
import PanelRow from '../ui/Panel/PanelRow'

const PREFIX = 'SettingsModal'

const classes = {
  indicator: `${PREFIX}indicator`,
}

/** The design draws the trailing chevron as a small glyph in a 24 box (Path 2, 8x13), not as
 *  MUI's full-size icon. gray50 is the one grey that reads on both the light panel and the dark
 *  one; gray70 (#4C4C4C) all but disappears against the dark theme's #222222. */
const CHEVRON_SX = { fontSize: 16, color: 'colors.gray50' }

/** The drawer's own name, before a row is chosen. */
const MENU_TITLE = 'Community Settings'

/**
 * The community menu, drawn as the design library's Button row rather than MUI's list defaults
 * (see PanelRow, and "DM settings" 816:28609 for the same construct in a real menu): 48 tall,
 * 16/11 padding, a 16/26 title, a #F0F0F0 hover and an inset rule beneath.
 *
 * Kept as data because every row is the same shape; the testIds are verbatim because e2e resolves
 * these rows by them (`//div[@data-testid='<name>-settings-tab']`).
 */
interface SettingsRow {
  tab: string
  /** The menu entry. */
  title: string
  testId: string
  /** Id for the panel title, where something already resolves the tab by its heading. */
  titleTestId?: string
  /**
   * The panel prints its own heading, so the bar does not repeat it. Linked devices is the only
   * row that does: its body is the shared Link devices stage, whose large heading is the title
   * wherever it is drawn (the user's no-bar-title rule, design-system/ONBOARDING.md). Every other
   * panel's heading moved into the bar - Add members and Leave community last, which drew their
   * own h3 under a bar already carrying the same words.
   */
  titleInPanel?: boolean
  destructive?: boolean
}

const SETTINGS_ROWS: SettingsRow[] = [
  { tab: 'about', title: 'About Quiet', testId: 'about-settings-tab' },
  {
    tab: 'communityMembership',
    title: 'Community membership',
    testId: 'community-membership-settings-tab',
    titleTestId: 'community-membership-title',
  },
  { tab: 'notifications', title: 'Notifications', testId: 'notifications-settings-tab' },
  { tab: 'attachments', title: 'Files and Images', testId: 'attachments-settings-tab' },
  { tab: 'invite', title: 'Add Members', testId: 'invite-settings-tab' },
  { tab: 'qrcode', title: 'QR Code', testId: 'qr-code-settings-tab' },
  {
    tab: 'linkedDevices',
    title: 'Linked devices',
    testId: 'linked-devices-settings-tab',
    titleInPanel: true,
  },
  { tab: 'leaveCommunity', title: 'Leave community', testId: 'leave-community-settings-tab', destructive: true },
]

export interface SettingsComponentProps {
  open: boolean
  handleClose: () => void
  tabs: any
  leaveCommunityModal: ReturnType<typeof useModal>
  isWindows?: boolean
  /** Tab to open the drawer on, rather than its menu — e.g. 'invite' for Add Members. */
  focusTab?: string
}

export const SettingsComponent: React.FC<SettingsComponentProps> = ({
  open,
  handleClose,
  tabs,
  leaveCommunityModal,
  isWindows,
  focusTab,
}) => {
  const [currentTab, setCurrentTab] = useState('')
  const wasOpen = useRef(false)

  // `focusTab` is the tab to OPEN on, so it is read once, as the drawer opens:
  // opening with one lands straight on it, opening without one starts at the
  // menu. Reading it on every render would also drag the user back to that tab
  // after they navigated away from it inside an open drawer.
  useEffect(() => {
    if (open && !wasOpen.current) setCurrentTab(focusTab ?? '')
    wasOpen.current = open
  }, [open, focusTab])

  const handleChange = (tab: string) => {
    setCurrentTab(tab)
  }

  const handleCloseTab = () => {
    setCurrentTab('')
  }

  // Dismissing the whole panel forgets which tab was open, so it reopens at the menu.
  const handleCloseAll = () => {
    setCurrentTab('')
    handleClose()
  }

  const openDrawerWithTab = (tab: string) => {
    setCurrentTab(tab)
  }

  const TabComponent = tabs[currentTab]
  const currentRow = SETTINGS_ROWS.find(row => row.tab === currentTab)
  /**
   * The drawer is a dialog, and a dialog needs a name. The bar's title is that name wherever the
   * bar draws one, so the dialog points at it. Linked devices draws no bar title - its panel
   * prints the heading - and pointing at an element that is not there would leave the dialog
   * nameless, so that one row names itself with its own words instead.
   */
  const titleId = useId()
  const rowTitle = currentRow?.title ?? 'Settings'
  const barTitle = currentTab === '' ? MENU_TITLE : currentRow?.titleInPanel ? '' : rowTitle

  return (
    <>
      {/* One drawer, two contents. Two drawers on the same anchor meant picking a tab slid the menu
          out to the right and then slid the tab in from the right — a panel leaving and another
          arriving, where the design is one panel going deeper. Switching the content in place
          keeps the panel still. */}
      <Drawer
        open={open}
        onClose={handleCloseAll}
        anchor='right'
        aria-labelledby={barTitle ? titleId : undefined}
        aria-label={barTitle ? undefined : currentRow?.title}
      >
        {currentTab === '' ? (
          <List sx={{ width: PANEL_WIDTH, paddingTop: '0px' }}>
            <PanelHeader
              title={MENU_TITLE}
              titleId={titleId}
              handleClose={handleClose as () => void}
              // Settings has no design of its own saying otherwise, so it keeps the cross it had;
              // the back arrow is what the create-channel design asks for.
              leading={'close'}
              closeTestId={'close-settings-button'}
            />
            {SETTINGS_ROWS.map(row => (
              <PanelRow
                key={row.tab}
                title={row.title}
                onClick={() => handleChange(row.tab)}
                control={<ChevronRightIcon sx={CHEVRON_SX} />}
                destructive={row.destructive}
                testId={row.testId}
              />
            ))}
            {(process.env.NODE_ENV === 'development' || process.env.IS_E2E === 'true') && (
              <PanelRow
                title='Debug'
                onClick={() => handleChange('debug')}
                control={<ChevronRightIcon sx={CHEVRON_SX} />}
                testId='debug-settings-tab'
              />
            )}
          </List>
        ) : (
          <>
            {/* The tab kept its own header — a bare back arrow in a 40px box above a rule — while every
            other panel uses PanelHeader. The wrapper stays because e2e resolves the control as
            `//div[@data-testid="close-tab-button-box"]//button`. The panels used to print their own
            heading as well; now the bar carries it and they do not repeat it. */}
            <Box data-testid={'close-tab-button-box'} width={PANEL_WIDTH}>
              <PanelHeader
                title={barTitle}
                titleId={titleId}
                titleTestId={currentRow?.titleTestId}
                handleClose={handleCloseTab}
                leading={'back'}
              />
            </Box>
            <Box p={2} width={375}>
              {TabComponent && <TabComponent handleClose={handleCloseTab} currentTab={currentTab} />}
            </Box>
          </>
        )}
      </Drawer>
    </>
  )
}

export default SettingsComponent
