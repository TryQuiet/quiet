import { connect } from 'react-redux'
import Immutable from 'immutable'

import ChannelHeader from '../../../components/widgets/channels/ChannelHeader'
import contactsSelectors from '../../../store/selectors/contacts'

export const mapStateToProps = (state, props) => {
  const contact = contactsSelectors.contact(props.contactId)(state)
  return {
    channel: Immutable.fromJS({ name: contact.get('username') })
  }
}

export default connect(mapStateToProps)(ChannelHeader)
