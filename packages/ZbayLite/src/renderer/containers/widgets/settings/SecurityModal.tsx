
import React, { useEffect } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import SecurityModalComponent from '../../../components/widgets/SecurityModal'
import { withModal } from '../../../store/handlers/modals'
import { actions } from '../../../store/handlers/app'
import electronStore from '../../../../shared/electronStore'

const mapStateToProps = _state => ({
  test: 'test'
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      clearCurrentOpenTab: actions.clearModalTab
    },
    dispatch
  )

const SecurityModal = props => {
  let isTorEnabled
  let torAddress
  let defaultLightWalletServer
  let customLightWalletServer
  useEffect(() => {
    isTorEnabled = electronStore.get('isTorEnabled')
    torAddress = electronStore.get('torAddress')
    defaultLightWalletServer = electronStore.get('defaultLightWalletServer')
    customLightWalletServer = electronStore.get('customLightWalletServer')
  }, [])
  const initialValues = {
    isTorEnabled: isTorEnabled || 'no',
    torServerAddress: torAddress || '',
    defaultLightWalletServer: defaultLightWalletServer || 'yes',
    customLightWalletServer: customLightWalletServer || ''
  }
  return (
    <SecurityModalComponent {...props} initialValues={initialValues} />
  )
}

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  withModal('lightWalletSecurityModal')
)(SecurityModal)
