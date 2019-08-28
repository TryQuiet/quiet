import React, { useState } from 'react'
import PropTypes from 'prop-types'

import Tabs from '@material-ui/core/Tabs'
import AppBar from '@material-ui/core/AppBar'

import Modal from '../../../ui/Modal'
import Tab from '../../../ui/Tab'
import AccountSettingsForm from '../../../../containers/widgets/settings/AccountSettingsForm'
import ShippingSettingsForm from '../../../../containers/widgets/settings/ShippingSettingsForm'

const tabs = {
  account: AccountSettingsForm,
  shipping: ShippingSettingsForm
}

export const SettingsModal = ({
  open,
  handleExit
}) => {
  const [currentTab, setCurrentTab] = useState('account')
  const TabComponent = tabs[currentTab]
  return (
    <Modal
      open={open}
      handleClose={handleExit}
      title='Settings'
    >
      <AppBar position='static' color='default'>
        <Tabs value={currentTab} onChange={(e, value) => setCurrentTab(value)} indicatorColor='primary'>
          <Tab value='account' label='Account' />
          <Tab value='shipping' label='Shipping' />
        </Tabs>
      </AppBar>
      <TabComponent />
    </Modal>
  )
}

SettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleExit: PropTypes.func.isRequired
}

export default SettingsModal
