import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import BigNumber from 'bignumber.js'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import {
  Typography,
  TextField,
  FormControlLabel,
  Checkbox
} from '@material-ui/core'
import InputAdornment from '@material-ui/core/InputAdornment'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import CheckBoxIcon from '@material-ui/icons/CheckBox'
import LoadingButton from '../LoadingButton'
import InvitationModal from './InvitationModal'
import exchange from '../../../static/images/zcash/exchange.svg'
import Icon from '../Icon'
import { networkFee } from '../../../../shared/static'
const styles = theme => ({
  warrning: {
    marginTop: -16
  },
  inputDiv: {
    width: 45,
    '& input': {
      textAlign: 'center',
      fontSize: '1.25rem',
      fontWeight: 500,
      paddingTop: 4,
      paddingBottom: 3,
      paddingLeft: 5,
      paddingRight: 0
    }
  },
  amountDiv: {
    marginTop: theme.spacing(1)
  },
  zecAmount: {
    marginTop: theme.spacing(1)
  },
  checkboxDiv: {
    marginTop: 24,
    marginRight: 0,
    alignItems: 'flex-start'
  },
  buttonDiv: {
    marginTop: 24
  },
  button: {
    height: 60,
    width: 126,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.zbayBlue
  },
  exchangeDiv: {
    width: 40
  },
  moneyInput: {
    height: 60
  },
  divMoney: {
    width: '100%',
    marginTop: 24,
    minHeight: 42,
    '& .MuiFormHelperText-contained': {
      display: 'none'
    }
  },
  inputMark: {
    color: theme.palette.colors.darkGray
  },
  error: {
    marginTop: 8,
    color: theme.palette.colors.red
  },
  checkbox: {
    marginTop: -7,
    padding: 8
  },
  checkboxLabel: {
    letterSpacing: -0.1
  }
})

export const InvitationModalGenerate = ({
  classes,
  zecRate,
  amount,
  amountZec,
  includeAffiliate,
  affiliate,
  generateInvitation,
  setAmount,
  setStep,
  isLoading,
  setLoading,
  setAmountZec,
  balance
}) => {
  const disable = balance
    .minus(amountZec || amount / zecRate)
    .minus(networkFee)
    .lt(0)
  return (
    <InvitationModal title={`Invite a friend`}>
      <Grid item className={classes.warrning}>
        <Typography variant='body2'>
          Send a Zbay invite link to a friend with some funds attached. Once
          they install Zbay, they can open the link to reclaim funds. If you
          include an affiliate code, their automatic 1% donation will start
          going to you, not the Zbay team, so you'll earn money!
        </Typography>
      </Grid>
      <Grid container className={classes.divMoney}>
        <Grid xs item className={classes.moneyDiv}>
          <TextField
            name='usd'
            placeholder='0.00'
            variant='outlined'
            value={amountZec ? (amountZec * zecRate).toFixed(2) : amount}
            onChange={e => {
              setAmountZec(0)
              setAmount(e.target.value)
            }}
            InputProps={{
              inputProps: { min: 0, max: 99 },
              endAdornment: (
                <InputAdornment position='end'>
                  <span className={classes.inputMark}>USD</span>
                </InputAdornment>
              ),
              className: classes.moneyInput
            }}
          />
        </Grid>
        <Grid
          item
          container
          alignItems='center'
          justify='center'
          className={classes.exchangeDiv}
        >
          <Icon src={exchange} />
        </Grid>
        <Grid xs item className={classes.moneyDiv}>
          <TextField
            name='zec'
            placeholder='0.00'
            variant='outlined'
            value={amount ? (amount / zecRate).toFixed(4) : amountZec}
            onChange={e => {
              setAmountZec(e.target.value)
              setAmount(0)
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <span className={classes.inputMark}>ZEC</span>
                </InputAdornment>
              ),
              className: classes.moneyInput
            }}
          />
        </Grid>
      </Grid>
      {disable && (
        <Grid item xs className={classes.error}>
          <Typography variant='body2'>{`You can't send more than ${balance.minus(
            networkFee
          )}`}</Typography>
        </Grid>
      )}
      <Grid item>
        <FormControlLabel
          control={
            <Checkbox
              checked={affiliate}
              color='primary'
              onChange={e => {
                includeAffiliate(e.target.checked)
              }}
              className={classes.checkbox}
              icon={<CheckBoxOutlineBlankIcon style={{ fontSize: 18 }} />}
              checkedIcon={<CheckBoxIcon style={{ fontSize: 18 }} />}
            />
          }
          className={classes.checkboxDiv}
          label={
            <Typography variant='body2' className={classes.checkboxLabel}>
              Include affiliate code
            </Typography>
          }
        />
      </Grid>
      <Grid item className={classes.buttonDiv}>
        <LoadingButton
          variant='contained'
          size='large'
          color='primary'
          type='submit'
          fullWidth
          disabled={disable || isLoading}
          inProgress={isLoading}
          className={classes.button}
          onClick={async () => {
            setLoading(true)
            await generateInvitation(1)
            setStep(1)
            setLoading(false)
          }}
          text='Create link'
        />
      </Grid>
    </InvitationModal>
  )
}

InvitationModalGenerate.propTypes = {
  classes: PropTypes.object.isRequired,
  zecRate: PropTypes.number.isRequired,
  amount: PropTypes.string.isRequired,
  amountZec: PropTypes.string.isRequired,
  includeAffiliate: PropTypes.func.isRequired,
  setStep: PropTypes.func.isRequired,
  affiliate: PropTypes.bool.isRequired,
  setAmount: PropTypes.func.isRequired,
  setAmountZec: PropTypes.func.isRequired,
  generateInvitation: PropTypes.func.isRequired,
  setLoading: PropTypes.func.isRequired,
  balance: PropTypes.instanceOf(BigNumber).isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(InvitationModalGenerate)
