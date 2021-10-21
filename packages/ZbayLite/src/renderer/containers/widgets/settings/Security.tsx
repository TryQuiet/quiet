import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import SecurityComponent from '../../../components/widgets/settings/Security'
import { ModalName } from '../../../sagas/modals/modals.types'
import whitelistSelector from '../../../store/selectors/whitelist'
import whitelistHandlers from '../../../store/handlers/whitelist'
import { useModal } from '../../hooks'

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

  return { toggleAllowAll, removeImageHost, removeSiteHost }
}

export const Security = () => {
  const { allowAll, whitelisted } = useSecurityData()
  const { removeSiteHost, toggleAllowAll } = useSecurityActions(allowAll)

  const openSeedModal = useModal(ModalName.seedModal)

  return (
    <SecurityComponent
      allowAll={allowAll}
      toggleAllowAll={toggleAllowAll}
      openSeedModal={openSeedModal.handleOpen}
      whitelisted={whitelisted}
      removeSiteHost={removeSiteHost}
    />
  )
}

export default Security
