import { connect } from 'react-redux'

import ChannelHeader from '../../../components/widgets/channels/ChannelHeader'

import channelSelectors from '../../../store/selectors/channel'

export const mapStateToProps = state => ({
  channel: channelSelectors.channel(state)
})

export default connect(mapStateToProps)(ChannelHeader)
