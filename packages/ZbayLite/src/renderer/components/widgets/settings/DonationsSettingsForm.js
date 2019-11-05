import React, { useState } from 'react'
import PropTypes from 'prop-types'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import { FormControlLabel, Checkbox, TextField } from '@material-ui/core'

const styles = theme => ({
  container: {
    padding: theme.spacing(1),
    marginTop: theme.spacing(1)
  },
  addressField: {
    fontSize: 13,
    color: theme.palette.colors.black
  }
})

const checkAddress = (address, updateDonationAddress, setAddressStatus) => {
  const isValid = (/^t1[a-zA-Z0-9]{33}$|^ztestsapling1[a-z0-9]{75}$|^zs1[a-z0-9]{75}$/).test(address)
  if (isValid) {
    updateDonationAddress(address)
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
  updateDonationAddress
}) => {
  const [isAddressValid, setAddressStatus] = useState(!!initialValues.donationAddress)
  return (
    <Grid container direction={'row'} className={classes.container} spacing={2}>
      <Grid xs={12} item>
        <Grid item xs={12}>
          <Typography variant='body1'>Dontaion Recipient</Typography>
          <TextField
            name='donationAddress'
            fullWidth
            defaultValue={initialValues.donationAddress || ''}
            placeholder='Enter Zcash Address'
            helperText={isAddressValid || 'Please insert correct address'}
            error={!isAddressValid}
            onChange={(e) => checkAddress(e.target.value, updateDonationAddress, setAddressStatus)}
            InputProps={{ className: classes.field }}
          />
        </Grid>
      </Grid>
      <Grid xs={12} item>
        <FormControlLabel
          control={
            <Checkbox
              checked={donationAllow === 'true'}
              onChange={e => {
                updateDonation(e.target.checked)
              }}
              color='primary'
            />
          }
          label='Allow for sending a small donation to Zbay team'
        />
      </Grid>
    </Grid>
  )
}

DonationsSettingsForm.propTypes = {
  classes: PropTypes.object.isRequired,
  donationAllow: PropTypes.string,
  initialValues: PropTypes.object.isRequired,
  updateDonation: PropTypes.func.isRequired,
  updateDonationAddress: PropTypes.func.isRequired
}

export default withStyles(styles)(DonationsSettingsForm)
