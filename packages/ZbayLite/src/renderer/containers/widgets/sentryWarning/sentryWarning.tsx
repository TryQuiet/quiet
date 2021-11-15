import React, { useEffect } from 'react'
import { SentryWarningComponent } from '../../../components/widgets/sentryWarning/SentryWarningComponent'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'

const SentryWarning = () => {
  const modal = useModal(ModalName.sentryWarningModal)

  useEffect(() => {
    if (process.env.REACT_APP_ENABLE_SENTRY) {
      modal.handleOpen()
    }
  }, [process.env.REACT_APP_ENABLE_SENTRY])

  return <SentryWarningComponent {...modal} />
}

export default SentryWarning
