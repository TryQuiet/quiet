import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import * as Yup from 'yup'
import { Formik, Form } from 'formik'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'react-custom-scrollbars'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import MenuItem from '@material-ui/core/MenuItem'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'

import TextField from '../../ui/form/TextField'
import SelectField from '../../ui/form/SelectField'
import countryData from './countryData'
import UnfoldMore from '@material-ui/icons/UnfoldMore'

const styles = theme => ({
  fullWidth: {
    width: '100%'
  },
  item: {
    marginTop: 19
  },
  submitButton: {},
  label: {
    fontSize: 12,
    color: theme.palette.colors.black30
  },
  button: {
    marginTop: 14,
    height: 60,
    width: 126,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.zbayBlue
  },
  title: {
    marginBottom: 14
  },
  spacing: {
    marginLeft: 16
  }
})

export const formSchema = Yup.object().shape({
  firstName: Yup.string().required('Required'),
  lastName: Yup.string().required('Required'),
  street: Yup.string().required('Required'),
  country: Yup.string()
    .oneOf(R.keys(countryData))
    .required('Required'),
  region: Yup.string()
    .when('country', (country, schema) =>
      schema.oneOf(R.propOr([], country, countryData))
    )
    .required('Required'),
  city: Yup.string().required('Required'),
  postalCode: Yup.string().required('Required')
})

export const ShippingSettingsForm = ({
  classes,
  initialValues,
  handleSubmit
}) => (
  <AutoSizer>
    {({ width, height }) => (
      <Scrollbars
        autoHideTimeout={500}
        style={{ width: width, height: height }}
      >
        <Formik
          onSubmit={handleSubmit}
          validationSchema={formSchema}
          initialValues={initialValues}
        >
          {({ values, isSubmitting }) => (
            <Form className={classes.fullWidth}>
              <Grid container direction='column' alignItems='flex-start'>
                <Grid item className={classes.title}>
                  <Typography variant='h3'>Shipping Address</Typography>
                </Grid>

                <Grid item container direction='row' justify='space-between'>
                  <Grid item xs>
                    <Typography className={classes.label} variant='body2'>
                      First Name
                    </Typography>
                    <TextField
                      id='first-name'
                      name='firstName'
                      className={classes.field}
                      margin='none'
                      variant='outlined'
                      value={values.firstName}
                    />
                  </Grid>
                  <Grid item xs className={classes.spacing}>
                    <Typography className={classes.label} variant='body2'>
                      Last Name
                    </Typography>
                    <TextField
                      id='last-name'
                      name='lastName'
                      className={classes.field}
                      margin='none'
                      variant='outlined'
                      value={values.lastName}
                    />
                  </Grid>
                </Grid>
                <Grid
                  item
                  container
                  direction='row'
                  justify='space-between'
                  className={classes.item}
                >
                  <Grid item xs={12}>
                    <Typography className={classes.label} variant='body2'>
                      Country
                    </Typography>
                    <SelectField
                      id='country'
                      name='country'
                      variant='outlined'
                      fullWidth
                      IconComponent={UnfoldMore}
                    >
                      {R.keys(countryData).map(c => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </SelectField>
                  </Grid>
                </Grid>
                <Grid
                  item
                  container
                  direction='row'
                  justify='space-between'
                  className={classes.item}
                >
                  <Grid item xs={12}>
                    <Typography className={classes.label} variant='body2'>
                      Region
                    </Typography>
                    <SelectField
                      id='region'
                      name='region'
                      variant='outlined'
                      fullWidth
                      IconComponent={UnfoldMore}
                    >
                      {R.propOr([], values.country, countryData).map(r => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </SelectField>
                  </Grid>
                </Grid>
                <Grid
                  item
                  container
                  direction='row'
                  justify='space-between'
                  className={classes.item}
                >
                  <Grid item xs>
                    <Typography className={classes.label} variant='body2'>
                      City
                    </Typography>
                    <TextField
                      id='city'
                      name='city'
                      className={classes.field}
                      margin='none'
                      variant='outlined'
                      value={values.city}
                    />
                  </Grid>
                  <Grid item xs className={classes.spacing}>
                    <Typography className={classes.label} variant='body2'>
                      Postal Code
                    </Typography>
                    <TextField
                      id='postal-code'
                      name='postalCode'
                      className={classes.field}
                      margin='none'
                      variant='outlined'
                      value={values.postalCode}
                    />
                  </Grid>
                </Grid>
                <Grid container item className={classes.item}>
                  <Grid item xs={12}>
                    <Typography className={classes.label} variant='body2'>
                      Street Address
                    </Typography>
                    <TextField
                      id='street-address'
                      name='street'
                      fullWidth
                      margin='none'
                      variant='outlined'
                      value={values.street}
                    />
                  </Grid>
                </Grid>
                <Grid container item>
                  <Grid item xs={12} className={classes.submitButton}>
                    <Button
                      variant='contained'
                      size='large'
                      color='primary'
                      type='submit'
                      fullWidth
                      disabled={isSubmitting}
                      className={classes.button}
                    >
                      Save
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Scrollbars>
    )}
  </AutoSizer>
)

ShippingSettingsForm.propTypes = {
  classes: PropTypes.object.isRequired,
  initialValues: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    street: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
    region: PropTypes.string.isRequired,
    city: PropTypes.string.isRequired,
    postalCode: PropTypes.string.isRequired
  }).isRequired,
  handleSubmit: PropTypes.func.isRequired
}

ShippingSettingsForm.defaultProps = {
  initialValues: {
    firstName: '',
    lastName: '',
    street: '',
    country: '',
    region: '',
    city: '',
    postalCode: ''
  }
}

export default withStyles(styles)(ShippingSettingsForm)
