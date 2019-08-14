import React from 'react'
import PropTypes from 'prop-types'
import Immutable from 'immutable'
import * as R from 'ramda'
import { Scrollbars } from 'react-custom-scrollbars'
import { withContentRect } from 'react-measure'

import Grid from '@material-ui/core/Grid'
import List from '@material-ui/core/List'
import RootRef from '@material-ui/core/RootRef'
import { withStyles } from '@material-ui/core/styles'

import { messageType } from '../../../zbay/messages'
import ChannelMessage from '../../../containers/widgets/channels/ChannelMessage'
import ChannelTransferMessage from '../../../containers/widgets/channels/ChannelTransferMessage'

const styles = theme => ({
  wrapper: {
    background: theme.palette.primary.light,
    flexGrow: 1
  },
  list: {
    padding: '0 8px',
    width: '100%'
  }
})

// TODO: scrollbar smart pagination
export const ChannelMessages = ({
  classes,
  messages,
  measureRef,
  contentRect,
  setScrollPosition,
  scrollPosition
}) => {
  const scrollbarRef = ref => {
    if (ref !== null) {
      if (scrollPosition === -1 || scrollPosition === 1) {
        ref.scrollToBottom()
      }
    }
  }
  return (
    <RootRef rootRef={measureRef}>
      <Grid container direction='column' justify='flex-end' className={classes.wrapper}>
        <Scrollbars
          autoHide
          autoHeight
          autoHeightMax={contentRect.bounds.height}
          ref={scrollbarRef}
          autoHideTimeout={500}
          onScrollFrame={e => {
            setScrollPosition(e.top)
          }}
        >
          <List disablePadding className={classes.list}>
            {messages.map(msg => {
              const MessageComponent = typeToMessageComponent[msg.get('type')]
              return <MessageComponent key={msg.get('id')} message={msg} />
            })}
          </List>
        </Scrollbars>
      </Grid>
    </RootRef>
  )
}

const typeToMessageComponent = {
  [messageType.BASIC]: ChannelMessage,
  [messageType.TRANSFER]: ChannelTransferMessage
}

ChannelMessages.propTypes = {
  classes: PropTypes.object.isRequired,
  messages: PropTypes.instanceOf(Immutable.List).isRequired,
  measureRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(React.Element) })
  ]).isRequired,
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
  withStyles(styles),
  withContentRect('bounds')
)(ChannelMessages)
