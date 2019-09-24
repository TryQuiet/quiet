import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Collapse from '@material-ui/core/Collapse'
import { withStyles } from '@material-ui/core/styles'

import { _DisplayableMessage } from '../../../zbay/messages'
import ChannelMessageActions from './ChannelMessageActions'
import BasicMessage from './BasicMessage'

const styles = theme => ({
  message: {
    fontSize: 14,
    letterSpacing: 0.4,
    lineHeight: '24px',
    marginTop: theme.spacing(1),
    whiteSpace: 'pre-line',
    wordBreak: 'break-word'
  },
  messageInput: {
    marginTop: -25,
    marginLeft: 50
  }
})

export const ChannelMessage = ({ classes, message, onResend, onReply, onCancel }) => {
  const fromYou = message.get('fromYou', false)
  const status = message.get('status', 'broadcasted')
  const [actionsOpen, setActionsOpen] = useState(false)

  return (
    <BasicMessage message={message} actionsOpen={actionsOpen} setActionsOpen={setActionsOpen}>
      <Grid className={classes.messageInput} item>
        <Typography variant='body2' className={classes.message}>
          {message.get('message')}
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
