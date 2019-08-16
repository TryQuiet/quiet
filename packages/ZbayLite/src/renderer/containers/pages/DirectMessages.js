import React from 'react'
import { connect } from 'react-redux'

import ChannelComponent from '../../components/pages/Channel'

const DirectMessages = ({ match }) => {
  return <ChannelComponent contactId={match.params.id} />
}

export default connect()(DirectMessages)
