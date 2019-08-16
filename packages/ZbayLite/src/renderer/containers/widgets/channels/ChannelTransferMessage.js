import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import operationsHandlers from '../../../store/handlers/operations'
import channelHandlers from '../../../store/handlers/channel'
import ChannelTransferMessage from '../../../components/widgets/channels/ChannelTransferMessage'
import { rate } from '../../../store/selectors/rates'
import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = state => ({
  rateUsd: rate('usd')(state),
  userAddress: identitySelectors.address(state)
})

export const mapDispatchToProps = (dispatch, ownProps) =>
  bindActionCreators(
    {
      onCancel: () => operationsHandlers.actions.removeOperation(ownProps.message.get('id')),
      onResend: () => channelHandlers.epics.resendMessage(ownProps.message.toJS())
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChannelTransferMessage)
