import React from 'react'
import * as R from 'ramda'

import { withModal } from '../../../store/handlers/modals'
import CreateChannelModal from '../../../components/widgets/channels/CreateChannelModal'

export default R.compose(
  React.memo,
  withModal('createChannel')
)(CreateChannelModal)
