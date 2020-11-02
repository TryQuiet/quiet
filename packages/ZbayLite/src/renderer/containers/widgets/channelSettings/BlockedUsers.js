import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import moderationActions from '../../../store/handlers/moderationActions'
import BlockedUsers from '../../../components/widgets/channelSettings/BlockedUsers'
import channelSelectors from '../../../store/selectors/channel'
import contactsSelectors from '../../../store/selectors/contacts'
// import messagesSelectors from '../../../store/selectors/messages'
import usersSelector from '../../../store/selectors/users'
import { moderationActionsType } from '../../../../shared/static'

export const mapStateToProps = state => {
  return {
    blockedUsers: contactsSelectors.directMessages(channelSelectors.id(state))(state).blockedUsers,
    users: usersSelector.users(state)
  }
}

export const mapDispatchToProps = (dispatch, props) =>
  bindActionCreators(
    {
      unblockUser: publicKey =>
        moderationActions.epics.handleModerationAction({
          moderationType: moderationActionsType.UNBLOCK_USER,
          moderationTarget: publicKey
        })
    },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)(BlockedUsers)
