import React, { useState } from 'react'
import PropTypes from 'prop-types'

import Tabs from '@material-ui/core/Tabs'
import AppBar from '@material-ui/core/AppBar'
import { withStyles } from '@material-ui/core/styles'

import Modal from '../../../ui/Modal'
import Tab from '../../../ui/Tab'
import AccountSettingsForm from '../../../../containers/widgets/settings/AccountSettingsForm'
import ShippingSettingsForm from '../../../../containers/widgets/settings/ShippingSettingsForm'
import DonationsSettingsForm from '../../../../containers/widgets/settings/DonationsSettingsForm'

const tabs = {
  account: AccountSettingsForm,
  shipping: ShippingSettingsForm,
  donations: DonationsSettingsForm
}

const styles = theme => ({
  tabs: {
    color: theme.palette.colors.purple
  },
  indicator: {
    backgroundColor: theme.palette.colors.purple,
    height: 3
  },
  appbar: {
    backgroundColor: '#fff',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)'
  },
  disabled: {
    fontSize: 25,
    lineHeight: '15px',
    fontStyle: 'normal',
    fontWeight: 'normal'
  }
})

export const SettingsModal = ({ classes, open, handleClose }) => {
  const [currentTab, setCurrentTab] = useState('account')
  const TabComponent = tabs[currentTab]
  return (
    <Modal open={open} handleClose={handleClose} title='Settings'>
      <AppBar position='static' color='default' className={classes.appbar}>
        <Tabs
          value={currentTab}
          onChange={(e, value) => setCurrentTab(value)}
          textColor='primary'
          className={classes.tabs}
          classes={{ indicator: classes.indicator }}
        >
          <Tab value='account' label='Account' />
          <Tab value='shipping' label='Shipping' />
          <Tab value='donations' label='Dontaions' />
        </Tabs>
      </AppBar>
      <TabComponent />
    </Modal>
  )
}

SettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
}

export default withStyles(styles)(SettingsModal)
