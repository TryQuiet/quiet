import React from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import { Scrollbars } from 'react-custom-scrollbars'

import List from '@material-ui/core/List'
import { withStyles } from '@material-ui/core/styles'

import { messageType } from '../../../zbay/messages'
import ChannelMessage from '../../../containers/widgets/channels/ChannelMessage'
import ChannelTransferMessage from '../../../containers/widgets/channels/ChannelTransferMessage'
import ChannelItemTransferMessage from '../../../containers/widgets/channels/ItemTransferMessage'
import ChannelAdMessage from '../../../containers/widgets/channels/ListingMessage'

const styles = theme => ({
  list: {
    backgroundColor: theme.palette.colors.white,
    padding: '0 4px',
    width: '100%'
  }
})

const messagesTypesToDisplay = [1, 2, 4, 11, 41]

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
      ref={scrollbarRef}
      autoHideTimeout={500}
      onScrollFrame={e => {
        setScrollPosition(e.top)
      }}
    >
      <List disablePadding className={classes.list}>
        {messages.filter(msg => messagesTypesToDisplay.includes(msg.get('type'))).map(msg => {
          const MessageComponent = typeToMessageComponent[msg.get('type')]
          return <MessageComponent key={msg.get('id')} message={msg} contactId={contactId} />
        })}
      </List>
    </Scrollbars>
  )
}

const typeToMessageComponent = {
  [messageType.BASIC]: ChannelMessage,
  [messageType.ITEM_BASIC]: ChannelMessage,
  [messageType.ITEM_TRANSFER]: ChannelItemTransferMessage,
  [messageType.TRANSFER]: ChannelTransferMessage,
  [messageType.AD]: ChannelAdMessage
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

export default React.memo(withStyles(styles)(ChannelMessages))
