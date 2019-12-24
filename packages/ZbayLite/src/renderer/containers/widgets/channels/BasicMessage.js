import React from 'react'
import { connect } from 'react-redux'

import BasicMessage from '../../../components/widgets/channels/BasicMessage'
import channelSelectors from '../../../store/selectors/channel'
import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = state => {
  const signerPubKey = identitySelectors.signerPubKey(state)
  const channelOwner = channelSelectors.channelOwner(state)
  const shareableUri = channelSelectors.shareableUri(state)
  const channelModerators = channelSelectors.channelModerators(state)

  return {
    allowModeration: shareableUri
      ? channelOwner === signerPubKey || channelModerators.contains(signerPubKey)
      : false
  }
}

export default connect(mapStateToProps)(React.memo(BasicMessage))
