import React from 'react'

import Tabs from '@material-ui/core/Tabs'
import AppBar from '@material-ui/core/AppBar'
import { makeStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'

import Modal from '../../ui/Modal/Modal'
import Tab from '../../ui/Tab/Tab'
import Moderators from '../../../containers/widgets/channelSettings/Moderators'
import ChannelInfo from '../../../containers/widgets/channelSettings/ChannelInfo'
import Notifications from '../../../containers/widgets/channelSettings/Notifications'
import { Contact } from '../../../store/handlers/contacts'

const tabs = {
  channelInfo: ChannelInfo,
  moderators: Moderators,
  notifications: Notifications
}

const useStyles = makeStyles(theme => ({
  root: {
    zIndex: 1000,
    paddingLeft: 20,
    paddingTop: 32,
    paddingRight: 32
  },
  tabs: {
    color: theme.palette.colors.trueBlack
  },
  indicator: {
    height: '0 !important'
  },
  appbar: {
    backgroundColor: theme.palette.colors.white,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.0)'
  },
  disabled: {
    fontSize: 25,
    lineHeight: '15px',
    fontStyle: 'normal',
    fontWeight: 'normal'
  },
  tabsDiv: {
    width: 168
  },
  selected: {
    backgroundColor: theme.palette.colors.lushSky,
    borderRadius: 5,
    color: theme.palette.colors.white
  },
  tab: {
    minHeight: 32
  },
  content: {
    marginLeft: 32
  }
}))

const handleChange = (
  setCurrentTab: (value: string) => void,
  clearCurrentOpenTab: () => void,
  value: string
) => {
  clearCurrentOpenTab()
  setCurrentTab(value)
}

interface ChannelSettingsModalProps {
  open: boolean
  handleClose: () => void
  currentTab: keyof typeof tabs
  channel: Contact
  isOwner: boolean
  modalTabToOpen: keyof typeof tabs
  setCurrentTab: (tab: keyof typeof tabs) => void
  clearCurrentOpenTab: () => void
}

export const ChannelSettingsModal: React.FC<ChannelSettingsModalProps> = ({
  open,
  handleClose,
  currentTab,
  channel,
  isOwner,
  modalTabToOpen,
  setCurrentTab,
  clearCurrentOpenTab
}) => {
  const classes = useStyles({})
  let TabComponent: typeof tabs['channelInfo' | 'moderators' | 'notifications']
  if (isOwner) {
    TabComponent = tabs[modalTabToOpen || currentTab]
  } else {
    TabComponent = tabs.notifications
  }

  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title={`Settings for #${channel.username}`}
      isBold
      addBorder>
      <Grid container direction='row' className={classes.root}>
        <Grid item className={classes.tabsDiv}>
          <AppBar position='static' className={classes.appbar}>
            <Tabs
              value={isOwner ? modalTabToOpen || currentTab : 'notifications'}
              // eslint-disable-next-line
              onChange={(_e, value) => handleChange(setCurrentTab, clearCurrentOpenTab, value)}
              orientation='vertical'
              className={classes.tabs}
              textColor='inherit'
              classes={{ indicator: classes.indicator }}>
              {isOwner && (
                <Tab
                  value='channelInfo'
                  label='Channel info'
                  classes={{
                    selected: classes.selected
                  }}
                />
              )}
              {isOwner && (
                <Tab
                  value='moderators'
                  label='Moderators'
                  classes={{
                    selected: classes.selected
                  }}
                />
              )}

              <Tab
                value='notifications'
                label='Notifications'
                classes={{ selected: classes.selected }}
              />
            </Tabs>
          </AppBar>
        </Grid>
        <Grid item xs className={classes.content}>
          <TabComponent />
        </Grid>
      </Grid>
    </Modal>
  )
}

export default ChannelSettingsModal
