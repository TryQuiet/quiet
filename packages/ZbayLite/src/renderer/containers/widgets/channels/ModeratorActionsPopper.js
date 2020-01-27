import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import ModeratorActionsPopperComponent from '../../../components/widgets/channels/ModeratorActionsPopper'
import moderationHandlers from '../../../store/handlers/moderationActions'
import { moderationActionsType } from '../../../../shared/static'

export const mapDispatchToProps = (dispatch, { publicKey, txid }) => {
  return bindActionCreators(
    {
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
}
export const ModeratorActionsPopper = ({
  name,
  address,
  open,
  anchorEl,
  removeMessage,
  banUser
}) => {
  return (
    <ModeratorActionsPopperComponent
      name={name}
      address={address}
      open={open}
      anchorEl={anchorEl}
      banUser={banUser}
      removeMessage={removeMessage}
    />
  )
}

export default connect(null, mapDispatchToProps)(ModeratorActionsPopper)
