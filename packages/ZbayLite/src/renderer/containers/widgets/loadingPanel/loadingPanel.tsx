import React from 'react'

import { useModal } from '../../hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import LoadingPanelComponent from '../../../components/widgets/loadingPanel/loadingPanel'

const LoadingStartApp = () => {
  const loadingStartApp = useModal<{ message: string }>(ModalName.loadingPanel)

  return (
    <LoadingPanelComponent
      {...loadingStartApp}
      isClosedDisabled={true}
    />
  )
}

export default LoadingStartApp
