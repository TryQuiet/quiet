import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import SecurityComponent from '../../../components/widgets/settings/Security'
import modalsHandlers, { ModalName } from '../../../store/handlers/modals'
import whitelistSelector from '../../../store/selectors/whitelist'
import whitelistHandlers from '../../../store/handlers/whitelist'

interface useSecurityDataReturnType {
  allowAll: boolean
  whitelisted: any[]
  autoload: any[]
}

export const useSecurityData = (): useSecurityDataReturnType => {
  const data = {
    allowAll: useSelector(whitelistSelector.allowAll),
    whitelisted: useSelector(whitelistSelector.whitelisted),
    autoload: useSelector(whitelistSelector.autoload)
  }
  return data
}

export const useSecurityActions = (allowAll: boolean) => {
  const dispatch = useDispatch()

  const toggleAllowAll = useCallback(() => {
    dispatch(whitelistHandlers.epics.setWhitelistAll(allowAll))
  }, [dispatch, allowAll])

  const removeImageHost = useCallback((hostname: string) => {
    dispatch(whitelistHandlers.epics.removeImageHost(hostname))
  }, [dispatch])

  const removeSiteHost = useCallback((hostname: string) => {
    dispatch(whitelistHandlers.epics.removeSiteHost(hostname))
  }, [dispatch])

  const openSeedModal = useCallback(() => {
    dispatch(modalsHandlers.actionCreators.openModal(ModalName.seedModal))
  }, [dispatch])

  return { toggleAllowAll, removeImageHost, removeSiteHost, openSeedModal }
}

export const Security = () => {
  const { allowAll, whitelisted } = useSecurityData()
  const { openSeedModal, removeSiteHost, toggleAllowAll } = useSecurityActions(allowAll)

  return (
    <SecurityComponent
      allowAll={allowAll}
      toggleAllowAll={toggleAllowAll}
      openSeedModal={openSeedModal}
      whitelisted={whitelisted}
      removeSiteHost={removeSiteHost}
    />
  )
}

export default Security
