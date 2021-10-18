import React, { useEffect } from 'react'

import SecurityModalComponent from '../../../components/widgets/SecurityModal'
import { ModalName, useModal } from '../../../store/handlers/modals'
import electronStore from '../../../../shared/electronStore'

const SecurityModal: React.FC = () => {
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
    lightWalletServerUrl: customLightWalletServer || ''
  }
  const modal = useModal(ModalName.lightWalletSecurityModal)
  return <SecurityModalComponent {...modal} initialValues={initialValues} />
}

export default SecurityModal
