import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import ImportedChannel from '../../../components/widgets/channels/ImportedChannel'
import importedChannelHandlers from '../../../store/handlers/importedChannel'
import importedChannelSelectors from '../../../store/selectors/importedChannel'

export const mapStateToProps = state => ({
  channel: importedChannelSelectors.data(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  onCancel: importedChannelHandlers.actions.clear,
  onAccept: importedChannelHandlers.epics.importChannel
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(ImportedChannel)
