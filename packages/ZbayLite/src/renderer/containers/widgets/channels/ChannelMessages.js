import { connect } from 'react-redux'

import ChannelMessages from '../../../components/widgets/channels/ChannelMessages'
import channelSelectors from '../../../store/selectors/channel'

export const mapStateToProps = state => ({
  messages: channelSelectors.messages(state)
})

export default connect(mapStateToProps)(ChannelMessages)
