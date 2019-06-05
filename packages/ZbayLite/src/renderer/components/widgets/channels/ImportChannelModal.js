import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Modal from '../../ui/Modal'

import ImportChannelForm from '../../../containers/widgets/channels/ImportChannelForm'
import ImportedChannel from '../../../containers/widgets/channels/ImportedChannel'

export const ImportChannelModal = ({ open, handleClose }) => (
  <Modal
    open={open}
    handleClose={handleClose}
    title='Import channel'
  >
    <ImportChannelForm />
    <ImportedChannel />
  </Modal>
)

ImportChannelModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
}

export default R.compose(
  React.memo
)(ImportChannelModal)
