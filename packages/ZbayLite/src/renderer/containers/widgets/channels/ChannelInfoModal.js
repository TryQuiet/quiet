import { connect } from 'react-redux'
import * as R from 'ramda'

import { withModal } from '../../../store/handlers/modals'
import channelSelectors from '../../../store/selectors/channel'
import ChannelInfoModal from '../../../components/widgets/channels/ChannelInfoModal'

export const mapStateToProps = state => ({
  channel: channelSelectors.data(state),
  shareUri: channelSelectors.shareableUri(state)
})

export default R.compose(
  connect(mapStateToProps),
  withModal('channelInfo')
)(ChannelInfoModal)
