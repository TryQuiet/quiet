import React, { useCallback, useEffect } from 'react'
import { ModalName } from '../../../sagas/modals/modals.types'
import { useModal } from '../../hooks'
import UpdateModal from '../../../components/widgets/update/UpdateModal'

import Button from '@mui/material/Button'
import theme from '../../../theme'

const BreakingChangesWarning = () => {
  const modal = useModal(ModalName.breakingChangesWarning)

  useEffect(() => {
    modal.handleOpen() // Open modal once per app start
  }, [])

  const title = 'Update available'
  const message =
    'Quiet’s next release makes joining communities faster and more reliable by letting people join when the owner is offline! 🎉 However, these changes are not backwards compatible, so you must re-install Quiet from tryquiet.org and re-create or re-join your community. 😥 This version of Quiet will no longer receive any updates or security fixes, so please re-install soon. We apologize for the inconvenience.'

  const updateAction = useCallback(() => {
    console.log('implement me')
  }, [])

  const updateButton = (
    <Button
      variant='contained'
      size='large'
      color='primary'
      type='submit'
      onClick={updateAction}
      style={{
        height: 55,
        fontSize: '0.9rem',
        backgroundColor: theme.palette.colors.quietBlue,
      }}
      fullWidth
    >
      Install Quiet 2.x
    </Button>
  )

  const dismissButton = (
    <Button
      variant='text'
      size='large'
      color='primary'
      type='submit'
      onClick={modal.handleClose}
      style={{
        height: 55,
        fontSize: '0.9rem',
        color: theme.palette.colors.gray70,
        backgroundColor: theme.palette.colors.white,
      }}
      fullWidth
    >
      Later
    </Button>
  )

  return <UpdateModal {...modal} buttons={[updateButton, dismissButton]} title={title} message={message} />
}

export default BreakingChangesWarning
