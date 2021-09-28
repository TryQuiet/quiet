import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import IdentityPanelComponent from '../../components/ui/IdentityPanel/IdentityPanel'
import actionCreators from '../../store/handlers/modals'
import { identity } from '@zbayapp/nectar'

export const useData = () => {
  const data = {
    identity: useSelector(identity.selectors.currentIdentity)
  }
  return data
}

const IdentityPanel = () => {
  const { identity } = useData()
  const dispatch = useDispatch()

  const handleSettings = () => dispatch(actionCreators.openModalHandler('accountSettingsModal'))

  return <IdentityPanelComponent identity={identity} handleSettings={handleSettings} />
}

export default IdentityPanel
