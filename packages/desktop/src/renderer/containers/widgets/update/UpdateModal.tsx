import React from 'react'
import { AnyAction, Dispatch, bindActionCreators } from 'redux'
import { useDispatch } from 'react-redux'
import updateHandlers from '../../../store/handlers/update'

import { useModal } from '../../hooks'
import { ModalName } from '../../../sagas/modals/modals.types'

import UpdateModalComponent from '../../../components/widgets/update/UpdateModalComponent'

import Button from '@mui/material/Button'
import theme from '../../../theme'

export const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) =>
  bindActionCreators(
    {
      handleUpdate: updateHandlers.epics.startApplicationUpdate,
      rejectUpdate: updateHandlers.epics.declineUpdate,
    },
    dispatch
  )

const ApplicationUpdateModal: React.FC = () => {
  const dispatch = useDispatch()

  const actions = mapDispatchToProps(dispatch)
  const modal = useModal(ModalName.applicationUpdate)

  const title = 'Software update'
  const message = 'An update is availale for Quiet.'

  const button = (
    <Button
      variant='contained'
      size='large'
      color='primary'
      type='submit'
      onClick={actions.handleUpdate}
      style={{
        height: 55,
        fontSize: '0.9rem',
        backgroundColor: theme.palette.colors.quietBlue,
      }}
      fullWidth
    >
      Update now
    </Button>
  )

  return <UpdateModalComponent {...modal} {...actions} buttons={[button]} title={title} message={message} />
}

export default ApplicationUpdateModal
