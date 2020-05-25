import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'
import { DateTime } from 'luxon'
import { shell } from 'electron'

import Modal from './Modal'

const styles = theme => ({
  root: {
    maxWidth: 600,
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3)
  },
  title: {
    marginTop: 32,
    marginBottom: 24
  },
  label: {
    padding: 16,
    backgroundColor: theme.palette.colors.gray03,
    width: 145
  },
  fields: {
    borderRadius: 4,
    overflow: 'hidden',
    border: `1px solid ${theme.palette.colors.veryLightGray}`,
    marginBottom: 24
  },
  value: {
    padding: 16,
    wordBreak: 'break-all'
  },
  field: {
    borderBottom: `1px solid ${theme.palette.colors.veryLightGray}`
  },
  address: {
    wordBreak: 'break-all'
  },
  details: {
    marginBottom: 24
  },
  total: {
    padding: 16,
    fontWeight: 500
  },
  link: {
    color: theme.palette.colors.linkBlue,
    cursor: 'pointer'
  },
  pending: {
    fontWeight: 500,
    color: theme.palette.colors.yellow
  },
  confirmed: {
    fontWeight: 500,
    color: theme.palette.colors.greenDark
  }
})

export const SentFundsModal = ({
  classes,
  open,
  recipient,
  amountZec,
  handleClose,
  amountUsd,
  feeUsd,
  feeZec,
  memo,
  timestamp,
  valueWhenSent,
  currentBlock,
  blockTime,
  title
}) => {
  const timeTransaction = DateTime.fromSeconds(timestamp).toLocaleString({
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
  const pos = timeTransaction.lastIndexOf(',')
  const date =
    timeTransaction.slice(0, pos) +
    ' at' +
    timeTransaction.slice(pos + 1) +
    ' ' +
    DateTime.local().offsetNameShort

  return (
    <Modal open={open} handleClose={handleClose}>
      <AutoSizer>
        {({ width, height }) => (
          <Scrollbars
            autoHideTimeout={500}
            style={{ width: width, height: height }}
          >
            <Grid container className={classes.root}>
              <Grid className={classes.title} item xs={12}>
                <Typography variant='h3'>{title || `Sent Funds`}</Typography>
              </Grid>
              <Grid className={classes.details} item xs={12}>
                <Typography variant='body2'>Transaction details</Typography>
              </Grid>
              <Grid item className={classes.fields} xs={12}>
                <Grid item container className={classes.field} xs={12}>
                  <Grid item className={classes.label}>
                    To
                  </Grid>
                  <Grid item className={classes.value} xs>
                    {recipient}
                  </Grid>
                </Grid>
                <Grid item container className={classes.field} xs={12}>
                  <Grid item className={classes.label}>
                    Amount
                  </Grid>
                  <Grid item className={classes.value} xs>
                    {parseFloat(amountZec).toFixed(4)} ZEC ($
                    {parseFloat(amountUsd).toFixed(2)} USD)
                  </Grid>
                </Grid>
                <Grid item container className={classes.field} xs={12}>
                  <Grid item className={classes.label}>
                    Timestamp
                  </Grid>
                  <Grid item className={classes.value} xs>
                    {date}
                  </Grid>
                </Grid>
                {!!feeUsd && (
                  <Grid item container className={classes.field} xs={12}>
                    <Grid item className={classes.label}>
                      Fee
                    </Grid>
                    <Grid item className={classes.value} xs>
                      ${feeUsd.toFixed(4)}
                    </Grid>
                  </Grid>
                )}
                {!!valueWhenSent && (
                  <Grid item container className={classes.field} xs={12}>
                    <Grid item className={classes.label}>
                      Value when sent
                    </Grid>
                    <Grid item className={classes.value} xs>
                      ${valueWhenSent.toFixed(2)} USD{' '}
                      <span
                        className={classes.link}
                        onClick={() =>
                          shell.openExternal(
                            'https://www.tradingview.com/symbols/BTCUSD/'
                          )
                        }
                      >
                        Show historic price
                      </span>
                    </Grid>
                  </Grid>
                )}
                <Grid item container className={classes.field} xs={12}>
                  <Grid item className={classes.label}>
                    Confirmations
                  </Grid>
                  <Grid item className={classes.value} xs>
                    {currentBlock - blockTime < 0
                      ? 0
                      : currentBlock - blockTime}
                  </Grid>
                </Grid>
                <Grid item container className={classes.field} xs={12}>
                  <Grid item className={classes.label}>
                    Note
                  </Grid>
                  <Grid item className={classes.value} xs>
                    {memo}
                  </Grid>
                </Grid>
                <Grid item container className={classes.field} xs={12}>
                  <Grid item className={classes.label}>
                    Status
                  </Grid>
                  <Grid item className={classes.value} xs>
                    {currentBlock - blockTime > 24 ? (
                      <span className={classes.confirmed}>Confirmed</span>
                    ) : (
                      <span className={classes.pending}>Pending</span>
                    )}
                  </Grid>
                </Grid>
                <Grid item container className={classes.field} xs={12}>
                  <Grid item className={classes.label}>
                    Total
                  </Grid>
                  <Grid item className={classes.total} xs>
                    {(parseFloat(amountZec) + feeZec).toFixed(4)} ZEC ($
                    {(parseFloat(amountUsd) + feeUsd).toFixed(2)} USD)
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Scrollbars>
        )}
      </AutoSizer>
    </Modal>
  )
}

SentFundsModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  recipient: PropTypes.string.isRequired,
  amountZec: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  handleClose: PropTypes.func.isRequired,
  amountUsd: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  feeZec: PropTypes.number.isRequired,
  feeUsd: PropTypes.number.isRequired,
  memo: PropTypes.string.isRequired,
  timestamp: PropTypes.number.isRequired,
  currentBlock: PropTypes.number.isRequired,
  blockTime: PropTypes.number.isRequired,
  valueWhenSent: PropTypes.number
}
SentFundsModal.defaultProps = {
  recipient: '',
  amountZec: 0,
  amountUsd: 0,
  feeUsd: 0,
  feeZec: 0,
  memo: '',
  timestamp: 1700000,
  blockTime: Number.MAX_SAFE_INTEGER
}

export default R.compose(React.memo, withStyles(styles))(SentFundsModal)
