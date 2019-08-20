import { connect } from 'react-redux'
import * as R from 'ramda'

import { withModal } from '../../../store/handlers/modals'
import { directMessageChannel } from '../../../store/selectors/directMessageChannel'
import ChannelInfoModal from '../../../components/widgets/channels/ChannelInfoModal'

export const mapStateToProps = state => ({
  channel: directMessageChannel(state),
  directMessage: true
})

export default R.compose(
  connect(mapStateToProps),
  withModal('channelInfo')
)(ChannelInfoModal)
