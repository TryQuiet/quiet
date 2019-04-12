import { connect } from 'react-redux'

import ChannelsPanel from '../../../components/widgets/channels/ChannelsPanel'

import channelsSelectors from '../../../store/selectors/channels'

export const mapStateToProps = state => ({
  channels: channelsSelectors.data(state)
})

export default connect(mapStateToProps)(ChannelsPanel)
