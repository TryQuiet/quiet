import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import moderationActions from '../../../store/handlers/moderationActions'
import Moderators from '../../../components/widgets/channelSettings/Moderators'
import channelSelectors from '../../../store/selectors/channel'
import messagesSelectors from '../../../store/selectors/messages'
import usersSelector from '../../../store/selectors/users'
import modalsHandlers from '../../../store/handlers/modals'
import { moderationActionsType } from '../../../../shared/static'

export const mapStateToProps = state => {
  return {
    moderators: messagesSelectors.channelModerators(
      channelSelectors.channelId(state)
    )(state),
    users: usersSelector.users(state)
  }
}

export const mapDispatchToProps = (dispatch, props) =>
  bindActionCreators(
    {
      removeModerator: publicKey =>
        moderationActions.epics.handleModerationAction({
          moderationType: moderationActionsType.REMOVE_MOD,
          moderationTarget: publicKey
        }),
      openAddModerator: modalsHandlers.actionCreators.openModal('addModerator')
    },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)(Moderators)
