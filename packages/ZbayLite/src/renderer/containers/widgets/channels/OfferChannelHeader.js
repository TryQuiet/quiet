import { connect } from 'react-redux'
import Immutable from 'immutable'

import ChannelHeader from '../../../components/widgets/channels/ChannelHeader'
import offersSelectors from '../../../store/selectors/offers'

export const mapStateToProps = (state, props) => {
  const offerData = offersSelectors.offer(props.offer)(state)
  const channel = {
    name: offerData.name
  }
  return {
    channel: Immutable.fromJS(channel),
    directMessage: true
  }
}

export default connect(mapStateToProps)(ChannelHeader)
