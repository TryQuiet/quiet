import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ImportChannelFormComponent from '../../../components/widgets/channels/ImportChannelForm'
import importedChannelHandlers from '../../../store/handlers/importedChannel'
import notificationsHandlers from '../../../store/handlers/notifications'
import importedChannelSelectors from '../../../store/selectors/importedChannel'

export const mapStateToProps = state => ({
  decoding: importedChannelSelectors.decoding(state),
  decodedMessage: importedChannelSelectors.data(state),
  errors: importedChannelSelectors.errors(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  onDecode: importedChannelHandlers.epics.decodeChannel,
  enqueueSnackbar: notificationsHandlers.actions.enqueueSnackbar
}, dispatch)

export const ImportChannelForm = ({ decoding, decodedMessage, onDecode, enqueueSnackbar }) => {
  const decoded = !decoding && decodedMessage !== null
  return (
    <ImportChannelFormComponent
      onDecode={onDecode}
      decoding={decoding}
      decoded={decoded}
      enqueueSnackbar={enqueueSnackbar}
    />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ImportChannelForm)
