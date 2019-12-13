import React, { useState } from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import { FormControlLabel, Checkbox, TextField, FormHelperText, Switch } from '@material-ui/core'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import CheckBoxIcon from '@material-ui/icons/CheckBox'
import Button from '@material-ui/core/Button'

const styles = theme => ({
  addressField: {
    marginTop: 24
  },
  label: {
    fontSize: 12,
    color: theme.palette.colors.black30
  },
  checkboxLabel: {
    fontSize: 14,
    letterSpacing: 0.2
  },
  checkboxDiv: {
    marginTop: 6
  },
  controlLabel: {
    marginRight: 0
  },
  checkbox: {
    padding: 4,
    marginBottom: 1,
    marginLeft: 7
  },
  button: {
    marginTop: 14,
    height: 60,
    width: 126,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.zbayBlue
  },
  switchBase: {
    '&$checked': {
      color: theme.palette.colors.purple
    },
    '&$checked + $track': {
      backgroundColor: theme.palette.colors.purple
    }
  },
  checked: {},
  track: {}
})

const checkAddress = (address, setDonationAddress, setAddressStatus) => {
  const isValid = /^t1[a-zA-Z0-9]{33}$|^ztestsapling1[a-z0-9]{75}$|^zs1[a-z0-9]{75}$/.test(address)
  if (isValid) {
    setDonationAddress(address)
    setAddressStatus(true)
  } else {
    setAddressStatus(false)
  }
}

export const DonationsSettingsForm = ({
  classes,
  updateDonation,
  donationAllow,
  initialValues,
  updateDonationAddress,
  setDonationAllow,
  setDonationAddress,
  setShieldingTax,
  updateShieldingTax,
  shieldingTax
}) => {
  const [isAddressValid, setAddressStatus] = useState(!!initialValues.donationAddress)
  return (
    <Grid container direction={'row'}>
      <Grid xs={12} item>
        <Typography variant='h3'>Donations</Typography>
        <Grid item xs={12} className={classes.addressField}>
          <Typography variant='caption' className={classes.label}>
            Donation recipient
          </Typography>
          <TextField
            name='donationAddress'
            fullWidth
            variant='outlined'
            defaultValue={initialValues.donationAddress || ''}
            placeholder='Enter Zcash Address'
            helperText={!isAddressValid && 'Please insert correct address'}
            error={!isAddressValid}
            onChange={e => checkAddress(e.target.value, setDonationAddress, setAddressStatus)}
            InputProps={{ className: classes.field }}
          />
        </Grid>
      </Grid>
      <Grid xs={12} item className={classes.checkboxDiv}>
        <FormControlLabel
          control={
            <Checkbox
              checked={donationAllow === 'true'}
              onChange={e => {
                setDonationAllow(e.target.checked.toString())
              }}
              color='primary'
              className={classes.checkbox}
              icon={<CheckBoxOutlineBlankIcon style={{ fontSize: 18 }} />}
              checkedIcon={<CheckBoxIcon style={{ fontSize: 18 }} />}
            />
          }
          className={classes.controlLabel}
          label={
            <Typography variant='body2' className={classes.checkboxLabel}>
              Allow for sending a small donation to Zbay team
            </Typography>
          }
        />
      </Grid>
      <Grid xs={12} item>
        <FormControlLabel
          control={
            <Switch
              checked={shieldingTax}
              onChange={e => {
                setShieldingTax(e.target.checked.toString())
              }}
              classes={{
                switchBase: classes.switchBase,
                track: classes.track,
                checked: classes.checked
              }}
              value='antoine'
            />
          }
          label='Allow 1% shielding tax'
        />
        <FormHelperText>Here Holmes will provide some text</FormHelperText>
      </Grid>
      <Grid item xs={12} className={classes.submitButton}>
        <Button
          variant='contained'
          size='large'
          color='primary'
          type='submit'
          fullWidth
          disabled={!isAddressValid}
          className={classes.button}
          onClick={() => {
            updateDonationAddress(initialValues.donationAddress)
            updateShieldingTax(shieldingTax)
            updateDonation(donationAllow)
          }}
        >
          Save
        </Button>
      </Grid>
    </Grid>
  )
}

DonationsSettingsForm.propTypes = {
  classes: PropTypes.object.isRequired,
  donationAllow: PropTypes.string,
  initialValues: PropTypes.object.isRequired,
  updateDonation: PropTypes.func.isRequired,
  setDonationAddress: PropTypes.func.isRequired,
  setDonationAllow: PropTypes.func.isRequired,
  updateDonationAddress: PropTypes.func.isRequired,
  setShieldingTax: PropTypes.func.isRequired,
  updateShieldingTax: PropTypes.func.isRequired,
  shieldingTax: PropTypes.bool.isRequired
}

export default withStyles(styles)(DonationsSettingsForm)
