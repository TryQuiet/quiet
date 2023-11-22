import React, { useEffect } from 'react'
import { SentryWarningComponent } from '../../../components/widgets/sentryWarning/SentryWarningComponent'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'

const SentryWarning = () => {
    const modal = useModal(ModalName.sentryWarningModal)

    useEffect(() => {
        if (process.env.TEST_MODE === 'true') {
            modal.handleOpen()
        }
    }, [process.env.TEST_MODE])

    return <SentryWarningComponent {...modal} />
}

export default SentryWarning
