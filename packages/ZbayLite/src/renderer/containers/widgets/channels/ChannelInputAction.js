import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ChannelInputAction from '../../../components/widgets/channels/ChannelInputAction'

export const mapDispatchToProps = dispatch => bindActionCreators({
  onPostOffer: () => console.warn('[ChannelInputAction] onPostOffer not implemented'),
  onSendMoney: () => console.warn('[ChannelInputAction] onSendMoney not implemented')
}, dispatch)

export default connect(null, mapDispatchToProps)(ChannelInputAction)
