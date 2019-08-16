import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { lifecycle, withState } from 'recompose'
import * as R from 'ramda'
import DirectMessagesPanelComponent from '../../../components/widgets/channels/DirectMessagesPanel'

import contactsSelectors from '../../../store/selectors/contacts'
import contactsHandlers from '../../../store/handlers/contacts'
import { useInterval } from '../../hooks'

export const mapStateToProps = state => ({
  channels: contactsSelectors.contacts(state).toList()
})

export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      fetchMessages: contactsHandlers.epics.fetchMessages
    },
    dispatch
  )
}

export const DirectMessagesPanel = ({ channels, isLoading, fetchMessages }) => {
  useInterval(fetchMessages, 15000)
  return <DirectMessagesPanelComponent isLoading={isLoading} channels={channels} />
}

export default R.compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  withState('isLoading', 'setIsLoading', true),
  lifecycle({
    async componentDidMount () {
      await this.props.fetchMessages()
      this.props.setIsLoading(false)
    }
  })
)(DirectMessagesPanel)
