import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { actionCreators } from '../../../store/handlers/modals'
import ChannelInputAction from '../../../components/widgets/channels/ChannelInputAction'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onPostOffer: () => console.warn('[ChannelInputAction] onPostOffer not implemented'),
      onSendMoney: actionCreators.openModal('sendMoney')
    },
    dispatch
  )

export default R.compose(
  connect(
    null,
    mapDispatchToProps
  )
)(ChannelInputAction)
