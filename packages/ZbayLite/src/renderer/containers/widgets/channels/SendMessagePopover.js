import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import * as R from 'ramda'

import SendMessagePopover from '../../../components/widgets/channels/SendMessagePopover'
import identitySelectors from '../../../store/selectors/identity'
import contactsHandlers from '../../../store/handlers/contacts'
import moderationHandlers, {
  moderationActionsType
} from '../../../store/handlers/moderationActions'

export const mapStateToProps = state => ({
  identityId: identitySelectors.id(state)
})

export const mapDispatchToProps = (dispatch, { publicKey, txid }) =>
  bindActionCreators(
    {
      createContact: contactsHandlers.epics.createVaultContact,
      banUser: () =>
        moderationHandlers.epics.handleModerationAction({
          moderationType: moderationActionsType.BLOCK_USER,
          moderationTarget: publicKey
        }),
      removeMessage: () =>
        moderationHandlers.epics.handleModerationAction({
          moderationType: moderationActionsType.REMOVE_MESSAGE,
          moderationTarget: txid
        })
    },
    dispatch
  )

export default R.compose(
  React.memo,
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(SendMessagePopover)
