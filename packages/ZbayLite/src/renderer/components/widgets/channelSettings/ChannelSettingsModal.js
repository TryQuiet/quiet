import React from 'react'
import PropTypes from 'prop-types'

import Tabs from '@material-ui/core/Tabs'
import AppBar from '@material-ui/core/AppBar'
import { withStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'
import Immutable from 'immutable'

import Modal from '../../ui/Modal'
import Tab from '../../ui/Tab'
import BlockedUsers from '../../../containers/widgets/channelSettings/BlockedUsers'
import Moderators from '../../../containers/widgets/channelSettings/Moderators'
import ChannelInfo from '../../../containers//widgets/channelSettings/ChannelInfo'
import Notifications from '../../../containers//widgets/channelSettings/Notifications'

const tabs = {
  channelInfo: ChannelInfo,
  blockedUsers: BlockedUsers,
  moderators: Moderators,
  notifications: Notifications
}

const styles = theme => ({
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
})

const handleChange = (setCurrentTab, value) => {
  setCurrentTab(value)
}

export const ChannelSettingsModal = ({
  classes,
  open,
  handleClose,
  currentTab,
  setCurrentTab,
  channel,
  isOwner
}) => {
  const TabComponent = tabs[currentTab]
  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title={`Settings for #${channel.get('name')}`}
      isBold
      addBorder
    >
      <Grid container direction='row' className={classes.root}>
        <Grid item className={classes.tabsDiv}>
          <AppBar position='static' className={classes.appbar}>
            <Tabs
              value={currentTab}
              onChange={(e, value) => handleChange(setCurrentTab, value)}
              orientation='vertical'
              className={classes.tabs}
              textColor='inherit'
              classes={{ indicator: classes.indicator }}
            >
              {isOwner && (
                <Tab
                  value='channelInfo'
                  label='Channel info'
                  classes={{
                    tabRoot: classes.tab,
                    selected: classes.selected
                  }}
                />
              )}
              {isOwner && (
                <Tab
                  value='blockedUsers'
                  label='Blocked users'
                  classes={{
                    tabRoot: classes.tab,
                    selected: classes.selected
                  }}
                />
              )}
              {isOwner && (
                <Tab
                  value='moderators'
                  label='Moderators'
                  classes={{
                    tabRoot: classes.tab,
                    selected: classes.selected
                  }}
                />
              )}

              <Tab
                value='notifications'
                label='Notifications'
                classes={{ tabRoot: classes.tab, selected: classes.selected }}
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

ChannelSettingsModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  isOwner: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  currentTab: PropTypes.string,
  setCurrentTab: PropTypes.func.isRequired,
  channel: PropTypes.instanceOf(Immutable.Map).isRequired
}
ChannelSettingsModal.defaultProps = {
  channel: Immutable.Map({})
}

export default withStyles(styles)(ChannelSettingsModal)
