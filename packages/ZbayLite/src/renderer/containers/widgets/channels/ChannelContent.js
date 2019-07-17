import { connect } from 'react-redux'

import ChannelContent from '../../../components/widgets/channels/ChannelContent'
import channelSelectors from '../../../store/selectors/channel'

export const mapStateToProps = state => ({
  loader: channelSelectors.loader(state),
  inputLocked: channelSelectors.inputLocked(state)
})

export default connect(mapStateToProps)(ChannelContent)
