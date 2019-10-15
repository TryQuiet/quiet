import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { actionCreators } from '../../../store/handlers/modals'
import ChannelInputAction from '../../../components/widgets/channels/ChannelInputAction'
import directMessageSelectors from '../../../store/selectors/directMessageChannel'

export const mapDispatchToProps = (dispatch) => {
  return (
    bindActionCreators(
      {
        onPostOffer: () => console.warn('[ChannelInputAction] onPostOffer not implemented'),
        onSendMoney: (modalName, payload) => actionCreators.openModal(modalName, payload)()
      },
      dispatch
    )
  )
}

export const mapStateToProps = (state) => ({
  targetRecipientAddress: directMessageSelectors.targetRecipientAddress(state)
})

export default R.compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(ChannelInputAction)
