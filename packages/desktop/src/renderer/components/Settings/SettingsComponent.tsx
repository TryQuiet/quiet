import React, { useState } from 'react'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'

import { useModal } from '../../containers/hooks'
import { Box, Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '../ui'
import IconButton from '../ui/Icon/IconButton'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const PREFIX = 'SettingsModal'

const classes = {
  indicator: `${PREFIX}indicator`,
  leaveComunity: `${PREFIX}leaveCommunity`,
}

const TAB_TITLES: Record<string, string> = {
  about: 'About Quiet',
  notifications: 'Notifications',
  attachments: 'Files and Images',
  invite: 'Add Members',
  qrcode: 'QR Code',
  leaveCommunity: 'Leave community',
  debug: 'Debug Information',
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

  const openDrawerWithTab = (tab: string) => {
    setCurrentTab(tab)
  }

  const TabComponent = tabs[currentTab]

  return (
    <>
      <Drawer open={open} onClose={handleClose} anchor='right' ModalProps={{ keepMounted: true }}>
        <List sx={{ width: '375px', paddingTop: '0px' }}>
          <ListItem sx={{ paddingTop: '12px', paddingBottom: '12px' }}>
            <IconButton onClick={handleClose} data-testid={'close-settings-button'}>
              <CloseIcon />
            </IconButton>
            <ListItemText sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontWeight: '500' }}>Community Settings</Typography>
            </ListItemText>
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
          <ListItemButton data-testid={'attachments-settings-tab'} onClick={() => handleChange('attachments')}>
            <ListItemText>Files and Images</ListItemText>
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
          <ListItemButton data-testid={'qr-code-settings-tab'} onClick={() => handleChange('qrcode')}>
            <ListItemText> QR Code</ListItemText>
            <ListItemIcon>
              <ChevronRightIcon />
            </ListItemIcon>
          </ListItemButton>
          <Divider />
          <ListItemButton
            data-testid='leave-community-settings-tab'
            className={classes.leaveComunity}
            onClick={() => handleChange('leaveCommunity')}
          >
            <ListItemText sx={{ color: 'error.main' }}>Leave community</ListItemText>
            <ListItemIcon>
              <ChevronRightIcon />
            </ListItemIcon>
          </ListItemButton>
          <Divider />
          {(process.env.NODE_ENV === 'development' || process.env.IS_E2E === 'true') && (
            <ListItemButton data-testid={'debug-settings-tab'} onClick={() => handleChange('debug')}>
              <ListItemText>Debug</ListItemText>
              <ListItemIcon>
                <ChevronRightIcon />
              </ListItemIcon>
            </ListItemButton>
          )}
        </List>
      </Drawer>
      <Drawer
        open={currentTab !== ''}
        onClose={handleCloseTab}
        anchor='right'
        BackdropProps={{ invisible: true }}
        ModalProps={{ keepMounted: true, disablePortal: true }}
        sx={{ zIndex: theme => theme.zIndex.modal + 1 }}
      >
        <Box display='flex' flexDirection='column' height='100%' width={375}>
          <Box>
            <ListItem sx={{ paddingTop: '12px', paddingBottom: '12px' }}>
              <IconButton onClick={handleCloseTab} data-testid={'close-tab-button-box'}>
                <ArrowBackIcon />
              </IconButton>
              <ListItemText sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 500 }}>{TAB_TITLES[currentTab]}</Typography>
              </ListItemText>
            </ListItem>
            <Divider />
          </Box>
          <Box p={2} flex={1} overflow='auto'>
            {TabComponent && <TabComponent handleClose={handleCloseTab} />}
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default SettingsComponent
