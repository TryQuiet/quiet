import { connect } from 'react-redux'

import ChannelHeader from '../../../components/widgets/channels/ChannelHeader'
import contactsSelectors from '../../../store/selectors/contacts'

export const mapStateToProps = (state, props) => {
  const offerData = contactsSelectors.contact(props.offer)(state)
  const channel = {
    name: offerData.username
  }
  return {
    channel: channel,
    directMessage: true
  }
}

export default connect(mapStateToProps)(ChannelHeader)
