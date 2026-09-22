import React from 'react'
import List from '@mui/material/List'
import { useModal } from '../../../containers/hooks'
import SidebarRow from '../../ui/Sidebar/SidebarRow'
import { PersonAddIcon } from '../../ui/Sidebar/sidebarIcons'

export interface ProminentActionsPanelProps {
  /** The settings drawer; "Add members" opens it on its Invite tab. */
  accountSettingsModal: ReturnType<typeof useModal>
}

/**
 * "Prominent actions" from the Quiet Design Library's desktop sidebar
 * (`6218:16416`) — the rows that sit above the channel list.
 *
 * V1 draws three (Add members, Threads, Drafts); Quiet has neither threads nor
 * drafts, so only "Add members" is here.
 */
const ProminentActionsPanel: React.FC<ProminentActionsPanelProps> = ({ accountSettingsModal }) => {
  return (
    <List disablePadding data-testid='prominentActionsList'>
      <SidebarRow
        label='Add members'
        glyph={<PersonAddIcon />}
        onClick={() => accountSettingsModal.handleOpen({ focusTab: 'invite' })}
        data-testid='add-members-link'
        labelTestId='add-members-link-text'
      />
    </List>
  )
}

export default ProminentActionsPanel
