import React from 'react'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { withRouter } from 'react-router-dom'
import { DateTime } from 'luxon'

import ChannelMenuActionComponent from '../../../components/widgets/channels/ChannelMenuAction'
import { actionCreators } from '../../../store/handlers/modals'
import contactsHandler from '../../../store/handlers/contacts'
import dmChannelSelectors from '../../../store/selectors/directMessageChannel'
import notificationCenterHandlers from '../../../store/handlers/notificationCenter'
import { notificationFilterType } from '../../../../shared/static'

export const mapStateToProps = state => ({
  targetAddress: dmChannelSelectors.targetRecipientAddress(state)
})

export const mapDispatchToProps = (
  dispatch,
  { history, directMessage, offer, ...rest }
) => {
  return bindActionCreators(
    {
      onInfo: actionCreators.openModal('channelInfo'),
      onMute: () =>
        notificationCenterHandlers.epics.setContactNotification(
          notificationFilterType.MUTE
        ),
      onDelete: target =>
        contactsHandler.epics.deleteChannel({ ...target, history })
    },
    dispatch
  )
}
const ChannelMenuAction = ({ onDelete, targetAddress, ...props }) => {
  return (
    <ChannelMenuActionComponent
      onDelete={() =>
        onDelete({
          address: targetAddress,
          timestamp: parseInt(DateTime.utc().toSeconds())
        })
      }
      disableSettings
      {...props}
    />
  )
}
export default R.compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ChannelMenuAction)
