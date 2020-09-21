import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { actionCreators } from '../../../store/handlers/modals'
import ChannelInputAction from '../../../components/widgets/channels/ChannelInputAction'
import directMessageSelectors from '../../../store/selectors/directMessageChannel'
import channelSelectors from '../../../store/selectors/channel'

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      onPostOffer: payload => actionCreators.openModal('advert', payload)(),
      onSendMoney: (modalName, payload) =>
        actionCreators.openModal(modalName, payload)()
    },
    dispatch
  )
}

export const mapStateToProps = state => ({
  targetRecipientAddress: directMessageSelectors.targetRecipientAddress(state),
  channelData: channelSelectors.data(state)
})

export default R.compose(connect(mapStateToProps, mapDispatchToProps))(
  ChannelInputAction
)
