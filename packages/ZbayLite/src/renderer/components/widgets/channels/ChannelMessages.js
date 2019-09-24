import React from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import * as R from 'ramda'
import { Scrollbars } from 'react-custom-scrollbars'

import List from '@material-ui/core/List'
import { withStyles } from '@material-ui/core/styles'

import { messageType } from '../../../zbay/messages'
import ChannelMessage from '../../../containers/widgets/channels/ChannelMessage'
import ChannelTransferMessage from '../../../containers/widgets/channels/ChannelTransferMessage'

const styles = theme => ({
  list: {
    backgroundColor: theme.palette.colors.white,
    padding: '0 8px',
    width: '100%'
  }
})

// TODO: scrollbar smart pagination
export const ChannelMessages = ({
  classes,
  messages,
  contentRect,
  setScrollPosition,
  scrollPosition,
  contactId
}) => {
  const scrollbarRef = ref => {
    if (ref !== null) {
      if (scrollPosition === -1 || scrollPosition === 1) {
        ref.scrollToBottom()
      }
    }
  }
  return (
    <Scrollbars
      height={contentRect.bounds.height}
      ref={scrollbarRef}
      autoHideTimeout={500}
      onScrollFrame={e => {
        setScrollPosition(e.top)
      }}
    >
      <List disablePadding className={classes.list}>
        {messages.map(msg => {
          const MessageComponent = typeToMessageComponent[msg.get('type')]
          return <MessageComponent key={msg.get('id')} message={msg} contactId={contactId} />
        })}
      </List>
    </Scrollbars>
  )
}

const typeToMessageComponent = {
  [messageType.BASIC]: ChannelMessage,
  [messageType.TRANSFER]: ChannelTransferMessage
}

ChannelMessages.propTypes = {
  classes: PropTypes.object.isRequired,
  contactId: PropTypes.string,
  messages: PropTypes.instanceOf(Immutable.List).isRequired,
  contentRect: PropTypes.shape({
    bounds: PropTypes.shape({
      height: PropTypes.number
    }).isRequired
  })
}

ChannelMessages.defaultProps = {
  messages: []
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelMessages)
