import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import ReceivedInvitationModal from '../../../components/ui/InvitationModal/ReceivedInvitationModal'
import { withModal } from '../../../store/handlers/modals'
import modalsSelectors from '../../../store/selectors/modals'
import { Dialog } from '@material-ui/core'

const ReceivedInvitaionModalContainer = ({ open, handleClose, ...rest }) => (
  <Dialog open={open} onClose={handleClose}>
    <ReceivedInvitationModal handleClose={handleClose} {...rest} />
  </Dialog>
)

export const mapStateToProps = state => ({
  modalPayload: modalsSelectors.payload(state)
})

export default R.compose(
  React.memo,
  connect(
    mapStateToProps,
    null
  ),
  withModal('receivedInvitationModal')
)(ReceivedInvitaionModalContainer)
