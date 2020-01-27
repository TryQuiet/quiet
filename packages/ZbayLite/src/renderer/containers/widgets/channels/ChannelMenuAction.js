import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { withRouter } from 'react-router-dom'
import Immutable from 'immutable'
import ChannelMenuAction from '../../../components/widgets/channels/ChannelMenuAction'
import { actionCreators } from '../../../store/handlers/modals'
import importedChannelHandler from '../../../store/handlers/importedChannel'
import dmChannelSelectors from '../../../store/selectors/directMessageChannel'
import identitySelectors from '../../../store/selectors/identity'
import channelSelectors from '../../../store/selectors/channel'
import publicChannelsSelectors from '../../../store/selectors/publicChannels'

export const mapStateToProps = state => ({
  targetAddress: dmChannelSelectors.targetRecipientAddress(state),
  isOwner:
    channelSelectors.channelOwner(state) ===
    identitySelectors.signerPubKey(state),
  publicChannels: publicChannelsSelectors.publicChannels(state),
  channel: channelSelectors.data(state) || Immutable.Map({})
})

export const mapDispatchToProps = (dispatch, { history }) => {
  return bindActionCreators(
    {
      onInfo: actionCreators.openModal('channelInfo'),
      onMute: () => console.warn('[ChannelMenuAction] onMute not implemented'),
      onDelete: () => importedChannelHandler.epics.removeChannel(history),
      publishChannel: actionCreators.openModal('publishChannel'),
      onSettings: actionCreators.openModal('channelSettingsModal')
    },
    dispatch
  )
}

export default R.compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ChannelMenuAction)
