import React from 'react'
import PropTypes from 'prop-types'

import Tabs from '@material-ui/core/Tabs'
import AppBar from '@material-ui/core/AppBar'
import { withStyles } from '@material-ui/core/styles'
import { Grid } from '@material-ui/core'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'

import Modal from '../../../ui/Modal'
import Tab from '../../../ui/Tab'
import AccountSettingsForm from '../../../../containers/widgets/settings/AccountSettingsForm'
import ShippingSettingsForm from '../../../../containers/widgets/settings/ShippingSettingsForm'
import InvitationModal from '../../../../containers/ui/InvitationModal/InvitationModal'
import AddFundsModal from '../../../../containers/widgets/settings/AddFunds'
import Security from '../../../../containers/widgets/settings/Security'
import Notifications from '../../../../containers/widgets/settings/Notifications'
import BlockedUsers from '../../../../containers/widgets/settings/BlockedUsers'

const tabs = {
  account: AccountSettingsForm,
  shipping: ShippingSettingsForm,
  invite: InvitationModal,
  addFunds: AddFundsModal,
  security: Security,
  notifications: Notifications,
  blockedusers: BlockedUsers
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
    backgroundColor: '#fff',
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

const handleChange = (clearCurrentOpenTab, setCurrentTab, value) => {
  clearCurrentOpenTab()
  setCurrentTab(value)
}

export const SettingsModal = ({
  classes,
  open,
  handleClose,
  modalTabToOpen,
  clearCurrentOpenTab,
  currentTab,
  setCurrentTab,
  user
}) => {
  const [contentRef, setContentRef] = React.useState(null)
  const [offset, setOffset] = React.useState(0)
  const TabComponent = tabs[modalTabToOpen || currentTab]
  const adjustOffset = () => {
    if (contentRef.clientWidth > 600) {
      setOffset((contentRef.clientWidth - 600) / 2)
    }
  }
  React.useEffect(() => {
    if (contentRef) {
      window.addEventListener('resize', adjustOffset)
      adjustOffset()
    }
  }, [contentRef])
  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title={user}
      isBold
      addBorder
      contentWidth='100%'
    >
      <Grid
        ref={ref => {
          if (ref) {
            setContentRef(ref)
          }
        }}
        container
        direction='row'
        className={classes.root}
      >
        <Grid item className={classes.tabsDiv} style={{ marginLeft: offset }}>
          <AppBar position='static' className={classes.appbar}>
            <Tabs
              value={modalTabToOpen || currentTab}
              onChange={(e, value) =>
                handleChange(clearCurrentOpenTab, setCurrentTab, value)
              }
              orientation='vertical'
              className={classes.tabs}
              textColor='inherit'
              classes={{ indicator: classes.indicator }}
            >
              <Tab
                value='account'
                label='Account'
                classes={{ tabRoot: classes.tab, selected: classes.selected }}
              />
              <Tab
                value='notifications'
                label='Notifications'
                classes={{ tabRoot: classes.tab, selected: classes.selected }}
              />
              <Tab
                value='shipping'
                label='Shipping'
                classes={{ tabRoot: classes.tab, selected: classes.selected }}
              />
              <Tab
                value='addFunds'
                label='Add Funds'
                classes={{ tabRoot: classes.tab, selected: classes.selected }}
              />
              <Tab
                value='invite'
                label='Invite a Friend'
                classes={{ tabRoot: classes.tab, selected: classes.selected }}
              />
              <Tab
                value='security'
                label='Security'
                classes={{ tabRoot: classes.tab, selected: classes.selected }}
              />
              <Tab
                value='blockedusers'
                label='Blocked users'
                classes={{ tabRoot: classes.tab, selected: classes.selected }}
              />
            </Tabs>
          </AppBar>
        </Grid>
        <AutoSizer>
          {({ height }) => (
            <Scrollbars
              autoHideTimeout={500}
              style={{ width: 400 + offset, height: height }}
            >
              <Grid
                item
                className={classes.content}
                style={{ paddingRight: offset }}
              >
                <TabComponent />
              </Grid>
            </Scrollbars>
          )}
        </AutoSizer>
      </Grid>
    </Modal>
  )
}

SettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  modalTabToOpen: PropTypes.string,
  clearCurrentOpenTab: PropTypes.func.isRequired,
  currentTab: PropTypes.string,
  setCurrentTab: PropTypes.func.isRequired
}

export default withStyles(styles)(SettingsModal)
