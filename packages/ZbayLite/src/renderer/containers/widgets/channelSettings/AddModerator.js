import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import moderationActions from '../../../store/handlers/moderationActions'
import AddModerator from '../../../components/widgets/channelSettings/AddModerator'
import channelSelectors from '../../../store/selectors/channel'
import usersSelector from '../../../store/selectors/users'
import { withModal } from '../../../store/handlers/modals'
import messagesSelectors from '../../../store/selectors/messages'
import { moderationActionsType } from '../../../../shared/static'

export const mapStateToProps = state => {
  const members = channelSelectors
    .messages()(state)
    .reduce((acc, msg) => {
      return acc.add(msg.publicKey)
    }, new Set())
  const moderators = new Set(
    messagesSelectors.channelModerators(channelSelectors.channelId(state))(
      state
    )
  )
  return {
    members: new Set([...members].filter(x => !moderators.has(x))),
    users: usersSelector.users(state)
  }
}

export const mapDispatchToProps = (dispatch, props) =>
  bindActionCreators(
    {
      addModerator: publicKey =>
        moderationActions.epics.handleModerationAction({
          moderationType: moderationActionsType.ADD_MOD,
          moderationTarget: publicKey
        })
    },
    dispatch
  )

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  withModal('addModerator')
)(AddModerator)
