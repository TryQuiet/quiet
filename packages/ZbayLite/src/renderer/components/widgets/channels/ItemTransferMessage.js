import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import BigNumber from 'bignumber.js'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import BasicMessage from './BasicMessage'
import { _DisplayableMessage } from '../../../zbay/messages'
import { Typography } from '@material-ui/core'

const styles = theme => ({
  message: {
    marginTop: theme.spacing(1),
    whiteSpace: 'pre-line',
    fontStyle: 'normal',
    fontWeight: 'normal',
    wordBreak: 'break-word',
    color: theme.palette.colors.darkGray
  },
  messageInput: {
    marginTop: -35,
    marginLeft: 50
  }
})

export const ItemTransferMessage = ({ message, classes, rateUsd }) => {
  const [actionsOpen, setActionsOpen] = React.useState(false)
  const usdAmount = new BigNumber(message.spent)
    .times(rateUsd)
    .toFixed(2)
    .toString()
  return (
    <BasicMessage message={message} actionsOpen={actionsOpen} setActionsOpen={setActionsOpen}>
      <Grid className={classes.messageInput} item>
        <Typography variant='body2' className={classes.message}>
          {`Sent ${usdAmount} (${message.spent} ZEC) to @${message.offerOwner} for #${message.tag}`}
        </Typography>
      </Grid>
    </BasicMessage>
  )
}

ItemTransferMessage.propTypes = {
  classes: PropTypes.object.isRequired,
  rateUsd: PropTypes.object.isRequired,
  message: PropTypes.instanceOf(_DisplayableMessage).isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ItemTransferMessage)
