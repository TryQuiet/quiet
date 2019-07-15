import { connect } from 'react-redux'

import ChannelContent from '../../../components/widgets/channels/ChannelContent'
import channelSelectors from '../../../store/selectors/channel'
import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = state => ({
  loader: channelSelectors.loader(state),
  balance: identitySelectors.balance('zec')(state)
})

export default connect(mapStateToProps)(ChannelContent)
