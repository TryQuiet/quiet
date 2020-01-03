import { connect } from 'react-redux'
import * as R from 'ramda'
import { bindActionCreators } from 'redux'

import { withModal } from '../../store/handlers/modals'
import channelSelectors from '../../store/selectors/channel'
import feesSelectors from '../../store/selectors/fees'
import identitySelectors from '../../store/selectors/identity'
import publicChannelsSelectors from '../../store/selectors/publicChannels'
import ratesSelectors from '../../store/selectors/rates'
import PublishChannelModal from '../../components/ui/PublishChannelModal'
import publicChannelsHandlers from '../../store/handlers/publicChannels'

export const mapStateToProps = state => {
  return {
    balance: identitySelectors.balance('zec')(state),
    publicChannelFee: feesSelectors.publicChannelfee(state),
    channel: channelSelectors.data(state),
    publicChannels: publicChannelsSelectors.publicChannels(state),
    zcashRate: ratesSelectors.rate('usd')(state)
  }
}
export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      publishChannel: publicChannelsHandlers.epics.publishChannel
    },
    dispatch
  )
}
export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  withModal('publishChannel')
)(PublishChannelModal)
