import React, { useState } from 'react'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'

import { useModal } from '../../containers/hooks'
import { Box, Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '../ui'
import IconButton from '../ui/Icon/IconButton'

const PREFIX = 'SettingsModal'

const classes = {
  indicator: `${PREFIX}indicator`,
  leaveComunity: `${PREFIX}leaveCommunity`,
}

export interface SettingsComponentProps {
  open: boolean
  handleClose: () => void
  tabs: any
  leaveCommunityModal: ReturnType<typeof useModal>
  isWindows?: boolean
}

export const SettingsComponent: React.FC<SettingsComponentProps> = ({
  open,
  handleClose,
  tabs,
  leaveCommunityModal,
  isWindows,
}) => {
  const [currentTab, setCurrentTab] = useState('')

  const handleChange = (tab: string) => {
    setCurrentTab(tab)
  }

  const handleCloseTab = () => {
    setCurrentTab('')
  }

  const TabComponent = tabs[currentTab]

  return (
    <>
      <Drawer open={open} onClose={handleClose} title={'Settings'} anchor='right' BackdropProps={{ invisible: true }}>
        <List dense sx={{ minWidth: '375px' }}>
          <ListItem>
            <ListItemButton onClick={handleClose} sx={{ padding: '0px' }}>
              <ListItemIcon>
                <CloseIcon />
              </ListItemIcon>
            </ListItemButton>
            <ListItemText sx={{ padding: '0px 32px' }}>Community Settings</ListItemText>
          </ListItem>
          <Divider />
          <ListItemButton data-testid={'about-settings-tab'} onClick={() => handleChange('about')}>
            <ListItemText>About</ListItemText>
            <ListItemIcon>
              <ChevronRightIcon />
            </ListItemIcon>
          </ListItemButton>
          <Divider />

          <ListItemButton data-testid={'notifications-settings-tab'} onClick={() => handleChange('notifications')}>
            <ListItemText>Notifications</ListItemText>
            <ListItemIcon>
              <ChevronRightIcon />
            </ListItemIcon>
          </ListItemButton>
          <Divider />

          <ListItemButton data-testid={'invite-settings-tab'} onClick={() => handleChange('invite')}>
            <ListItemText>Add Members</ListItemText>
            <ListItemIcon>
              <ChevronRightIcon />
            </ListItemIcon>
          </ListItemButton>
          <Divider />
          <ListItemButton data-testid={'qr-code-tab'} onClick={() => handleChange('qrcode')}>
            <ListItemText> QR Code</ListItemText>
            <ListItemIcon>
              <ChevronRightIcon />
            </ListItemIcon>
          </ListItemButton>
          {!isWindows && (
            <>
              <Divider />
              <ListItemButton
                data-testid='leave-community-tab'
                className={classes.leaveComunity}
                onClick={leaveCommunityModal.handleOpen}
              >
                <ListItemText>Leave community</ListItemText>
                <ListItemIcon>
                  <ChevronRightIcon />
                </ListItemIcon>
              </ListItemButton>
            </>
          )}
          <Divider />
        </List>
      </Drawer>
      <Drawer open={currentTab !== ''} onClose={handleCloseTab} anchor='right' BackdropProps={{ invisible: true }}>
        <Box width={40}>
          <IconButton onClick={handleCloseTab}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box p={2} minWidth={375}>
          {TabComponent && <TabComponent />}
        </Box>
      </Drawer>
    </>
  )
}

export default SettingsComponent
