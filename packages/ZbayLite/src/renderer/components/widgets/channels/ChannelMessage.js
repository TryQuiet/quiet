import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import reactStringReplace from 'react-string-replace'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Collapse from '@material-ui/core/Collapse'
import { withStyles } from '@material-ui/core/styles'

import { _DisplayableMessage } from '../../../zbay/messages'
import ChannelMessageActions from './ChannelMessageActions'
import BasicMessage from './BasicMessage'

const styles = theme => ({
  message: {
    marginTop: theme.spacing(1),
    marginLeft: 6,
    whiteSpace: 'pre-line',
    wordBreak: 'break-word'
  },
  messageInput: {
    marginTop: -35,
    marginLeft: 50
  }
})
const checkLinking = (tags, users, onLinkedChannel, onLinkedUser, message) => {
  let parsedMessage = message
  parsedMessage = reactStringReplace(parsedMessage, /#[a-z0-9_-]/g, (match, i) => {
    if (!tags.get(match)) {
      return `#${match}`
    }
    return (
      <a
        style={{ color: '#2196f3' }}
        key={match + i}
        onClick={e => {
          e.preventDefault()
          onLinkedChannel(tags.get(match))
        }}
        href={``}
      >
        #{match}
      </a>
    )
  })
  parsedMessage = reactStringReplace(parsedMessage, /@[a-z0-9_-]/g, (match, i) => {
    if (!users.find(user => user.nickname === match)) {
      return `@${match}`
    }
    return (
      <a
        style={{ color: '#2196f3' }}
        key={match + i}
        onClick={e => {
          e.preventDefault()
          onLinkedUser(users.find(user => user.nickname === match))
        }}
        href={``}
      >
        @{match}
      </a>
    )
  })

  return parsedMessage
}
export const ChannelMessage = ({
  classes,
  message,
  onResend,
  onReply,
  onCancel,
  publicChannels,
  onLinkedChannel,
  onLinkedUser,
  users
}) => {
  const fromYou = message.get('fromYou', false)
  const status = message.get('status', 'broadcasted')
  const parsedMessage = checkLinking(
    publicChannels,
    users,
    onLinkedChannel,
    onLinkedUser,
    message.get('message')
  )
  const [actionsOpen, setActionsOpen] = useState(false)
  return (
    <BasicMessage message={message} actionsOpen={actionsOpen} setActionsOpen={setActionsOpen}>
      <Grid className={classes.messageInput} item>
        <Typography variant='body2' className={classes.message}>
          {parsedMessage}
        </Typography>
        <Collapse in={actionsOpen} timeout='auto'>
          <ChannelMessageActions
            onReply={() => onReply(message)}
            onResend={() => onResend(message)}
            onCancel={onCancel}
            fromYou={fromYou}
            status={status}
          />
        </Collapse>
      </Grid>
    </BasicMessage>
  )
}

ChannelMessage.propTypes = {
  classes: PropTypes.object.isRequired,
  message: PropTypes.instanceOf(_DisplayableMessage).isRequired,
  onResend: PropTypes.func,
  onCancel: PropTypes.func,
  onReply: PropTypes.func
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelMessage)
