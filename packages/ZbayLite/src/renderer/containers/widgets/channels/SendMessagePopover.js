import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter } from 'react-router-dom'
import * as R from 'ramda'

import SendMessagePopover from '../../../components/widgets/channels/SendMessagePopover'
import identitySelectors from '../../../store/selectors/identity'
import userSelectors from '../../../store/selectors/users'
import directMessages from '../../../store/handlers/contacts'
import directMessagesSelectors from '../../../store/selectors/directMessages'

export const mapStateToProps = state => ({
  identityId: identitySelectors.id(state),
  users: userSelectors.users(state),
  waggleUsers: directMessagesSelectors.users(state)
})

export const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      createNewContact: (contact) => directMessages.epics.createVaultContact(contact)
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
