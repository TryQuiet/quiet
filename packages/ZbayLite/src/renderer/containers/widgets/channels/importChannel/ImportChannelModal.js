import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { withModal } from '../../../../store/handlers/modals'

import ImportedChannelComponent from '../../../../components/widgets/channels/ImportedChannel'
import importedChannelHandlers from '../../../../store/handlers/importedChannel'
import importedChannelSelectors from '../../../../store/selectors/importedChannel'

export const mapStateToProps = state => ({
  channel: importedChannelSelectors.data(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  onCancel: importedChannelHandlers.actions.clear,
  onAccept: importedChannelHandlers.epics.importChannel
}, dispatch)

const ImportedChannel = ({ ...props }) => {
  const [isLoading, setIsLoading] = React.useState(false)
  return <ImportedChannelComponent isLoading={isLoading} setIsLoading={setIsLoading} {...props} />
}

export default R.compose(
  React.memo,
  withModal('importChannelModal'),
  connect(mapStateToProps, mapDispatchToProps)
)(ImportedChannel)
