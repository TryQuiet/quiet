import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import BigNumber from 'bignumber.js'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import BasicMessage from '../../../containers/widgets/channels/BasicMessage'
import { _DisplayableMessage } from '../../../zbay/messages'
import { Typography } from '@material-ui/core'

const styles = theme => ({
  data: {
    whiteSpace: 'pre-line',
    fontStyle: 'normal',
    fontWeight: 'normal',
    wordBreak: 'break-word',
    lineHeight: '24px',
    fontSize: 14
  },
  messageInput: {
    marginTop: -16,
    marginLeft: 46,
    border: `1px solid ${theme.palette.colors.veryLightGray}`,
    borderRadius: 8,
    width: 'fit-content',
    padding: '12px 16px'
  },
  amountUsd: {
    fontSize: 28,
    lineHeight: '34px',
    fontWeight: 'normal'
  },
  message: {
    fontSize: 12,
    lineHeight: '18px',
    letterSpacing: '0.4px',
    color: theme.palette.colors.gray40
  }
})

export const ItemTransferMessage = ({
  message,
  classes,
  rateUsd,
  openSentModal
}) => {
  const [actionsOpen, setActionsOpen] = React.useState(false)
  const usdAmount = new BigNumber(message.spent)
    .times(rateUsd)
    .toFixed(2)
    .toString()
  return (
    <BasicMessage
      message={message}
      actionsOpen={actionsOpen}
      setActionsOpen={setActionsOpen}
    >
      <Grid
        className={classes.messageInput}
        onClick={() =>
          openSentModal({
            fromYou: true,
            amountZec: parseFloat(message.spent.toString()),
            txid: message.id,
            memo: message.message,
            recipient: message.receiver.replyTo,
            timestamp: message.createdAt
          })
        }
        item
      >
        <Typography variant='h3' className={classes.amountUsd}>
          {`$${usdAmount}`}
        </Typography>
        <Typography variant='body2' className={classes.data}>
          {message.fromYou
            ? `You sent @${message.offerOwner ||
                message.receiver
                  .username} $${usdAmount} (${parseFloat(message.spent.toString()).toFixed(4)} ZEC) ${
              message.tag ? `for #${message.tag}` : ''
            }`
            : `Received from @${message.sender.username} $${usdAmount} (${
              message.spent
            } ZEC) ${message.tag ? `for #${message.tag}` : ''}`}
        </Typography>
        <Typography variant='body2' className={classes.message}>
          {message.message && `${message.message}`}
        </Typography>
      </Grid>
    </BasicMessage>
  )
}

ItemTransferMessage.propTypes = {
  classes: PropTypes.object.isRequired,
  rateUsd: PropTypes.object.isRequired,
  openSentModal: PropTypes.func.isRequired,
  message: PropTypes.instanceOf(_DisplayableMessage).isRequired
}

export default R.compose(React.memo, withStyles(styles))(ItemTransferMessage)
