import React, { useState } from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import Link from '@material-ui/core/Link'
import Grid from '@material-ui/core/Grid'
import Divider from '@material-ui/core/Divider'
import Typography from '@material-ui/core/Typography'
import Collapse from '@material-ui/core/Collapse'
import { withStyles } from '@material-ui/core/styles'

import red from '@material-ui/core/colors/red'

import { _DisplayableMessage } from '../../../zbay/messages'
import ChannelMessageActions from './ChannelMessageActions'

import ZecBalance from '../walletPanel/ZecBalance'
import SpinnerLoaderComponent from '../../ui/SpinnerLoader'
import Elipsis from '../../ui/Elipsis'
import BasicMessage from './BasicMessage'

const styles = theme => ({
  transactionCard: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2)
  },
  divider: {
    minWidth: `calc(100% + ${theme.spacing(4)}px)`,
    marginLeft: theme.spacing(-2),
    color: theme.palette.primary.main,
    height: 2
  },
  link: {
    color: theme.palette.colors.blue,
    fontSize: '0.9rem'
  },
  info: {
    paddingTop: theme.spacing(1)
  },
  failed: {
    color: red[500]
  },
  boldText: {
    fontWeight: '500'
  },
  message: {
    fontSize: '0.855rem',
    marginTop: theme.spacing(1),
    whiteSpace: 'pre-line',
    wordBreak: 'break-word'
  },
  spinner: {
    color: theme.palette.primary.main
  }
})

export const ChannelTransferMessage = ({
  classes,
  message,
  rateUsd,
  onResend,
  onReply,
  onCancel,
  userAddress
}) => {
  const [actionsOpen, setActionsOpen] = useState(false)
  const tnx = message.id
  const spentZec = message.spent
  const spentUsd = rateUsd.times(new BigNumber(spentZec || 0)).toFormat(2)
  const info = message.message
  const receiver = message.receiver || { username: '', replyTo: '' } // until we merge messages from vault
  const receiverUsername = receiver.username || 'Not Defined'
  const fromYou = message.fromYou || false
  const toYou = userAddress === receiver.replyTo || false

  const status = message.status || 'broadcasted'
  const error = message.error
  return (
    <BasicMessage message={message} actionsOpen={actionsOpen} setActionsOpen={setActionsOpen}>
      <React.Fragment>
        <Divider className={classes.divider} />
        <Grid container direction='column' justify='space-evenly' alignItems='center'>
          <Grid
            container
            direction='column'
            justify='space-evenly'
            alignItems='center'
            className={classes.transactionCard}
            spacing={0}
          >
            <Grid item xs={12}>
              <Typography variant='h5' className={classes.boldText}>
                ${spentUsd}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant='h5' className={classes.boldText}>
                <ZecBalance size={18} value={spentZec} />
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant='subtitle2' className={classes.boldText}>
                Sent to :
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant='subtitle2' className={classes.boldText}>
                {toYou ? 'You' : receiverUsername}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              {showStatusInfo({ status, classes, receiver, tnx, error })}
            </Grid>
          </Grid>
          <Divider className={classes.divider} />
          <Grid
            container
            direction='row'
            alignItems='center'
            justify='flex-start'
            className={classes.info}
          >
            <Grid item xs={12}>
              <Typography variant='body2' className={classes.message}>
                {info}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Collapse in={actionsOpen} timeout='auto'>
          <ChannelMessageActions
            onReply={() => onReply(message)}
            onResend={() => onResend(message)}
            onCancel={onCancel}
            fromYou={fromYou}
            status={status}
          />
        </Collapse>
      </React.Fragment>
    </BasicMessage>
  )
}

const showStatusInfo = ({ status, classes, tnx, error }) => {
  switch (status) {
    case 'broadcasted':
      return (
        <Link
          onClick={() => window.open(`https://explorer.zcha.in/transactions/${tnx}`)}
          variant='body1'
          className={classes.link}
        >
          {tnx}
        </Link>
      )
    case 'failed':
      return (
        <Elipsis
          interactive
          content={`Error ${error.code}: ${error.message}`}
          tooltipPlacement='bottom'
          length={60}
          classes={{ content: classes.failed }}
        />
      )
    case 'cancelled':
      return (
        <Elipsis
          interactive
          content={`Cancelled`}
          tooltipPlacement='bottom'
          length={60}
          classes={{ content: classes.failed }}
        />
      )
    case 'success':
      return (
        <SpinnerLoaderComponent
          classes={{ spinner: classes.spinner }}
          message={`Waiting for transaction to be mined 
    ID: ${tnx}`}
        />
      )
    default:
      return (
        <SpinnerLoaderComponent
          classes={{ spinner: classes.spinner }}
          message={'Loading Transaction Id'}
        />
      )
  }
}

ChannelTransferMessage.propTypes = {
  classes: PropTypes.object.isRequired,
  message: PropTypes.instanceOf(_DisplayableMessage).isRequired,
  onResend: PropTypes.func,
  onCancel: PropTypes.func,
  onReply: PropTypes.func,
  rateUsd: PropTypes.instanceOf(BigNumber),
  userAddress: PropTypes.string.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(ChannelTransferMessage)
