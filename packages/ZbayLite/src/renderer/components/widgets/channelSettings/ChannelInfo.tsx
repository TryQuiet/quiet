import React from 'react'
import * as Yup from 'yup'
import { Formik, Form } from 'formik'
import { AutoSizer } from 'react-virtualized'
import { Scrollbars } from 'rc-scrollbars'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'

import TextField from '../../ui/TextField/TextField'
import CheckboxWithLabel from '../../ui/Checkbox/CheckboxWithLabel'

const useStyles = makeStyles((theme) => ({
  submitButton: {},
  label: {
    fontSize: 12,
    color: theme.palette.colors.black30
  },
  button: {
    marginTop: 32,
    height: 60,
    width: 102,
    fontSize: 16,
    backgroundColor: theme.palette.colors.zbayBlue
  },
  title: {
    marginBottom: 24
  },
  channelDescription: {},
  descriptionDiv: {
    width: '100%'
  },
  checkboxDiv: {
    marginTop: 10
  },
  checkboxLabel: {
    fontSize: 14
  },
  rootClass: {
    marginRight: 0
  },
  divMoney: {
    paddingLeft: 22,
    width: '100%',
    marginTop: 16,
    minHeight: 42,
    '& .MuiFormHelperText-contained': {
      display: 'none'
    }
  },
  moneyDiv: {
    width: 147
  },
  moneyInput: {
    height: 42,
    '& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
      display: 'none'
    }
  },
  exchangeDiv: {
    width: 32
  },
  inputMark: {
    color: theme.palette.colors.darkGray
  },
  wrapper: {
    padding: '0px 25px'
  }
}))

export const formSchema = Yup.object().shape({
  updateChannelDescription: Yup.string(),
  amountUsd: Yup.number().min(0),
  amountZec: Yup.number()
    .max(1)
    .min(0),
  updateMinFee: Yup.boolean(),
  updateOnlyRegistered: Yup.boolean()
})

interface ChannelInfoProps {
  initialValues: {
    updateChannelDescription: string
    firstName?: string
  }
  updateChannelSettings?: () => void
}

export const ChannelInfo: React.FC<ChannelInfoProps> = ({
  initialValues = {
    updateChannelDescription: '',
    firstName: ''
  },
  updateChannelSettings
}) => {
  const classes = useStyles({})
  return (
    <AutoSizer>
      {({ width, height }) => (
        <Scrollbars
          autoHideTimeout={500}
          style={{ width: width + 50, height: height }}
        >
          <Grid container className={classes.wrapper}>
            <Grid item container>
              <Formik
                onSubmit={updateChannelSettings}
                validationSchema={formSchema}
                initialValues={initialValues}
              >
                {({ values, isSubmitting, isValid }) => {
                  return (
                    <Form >
                      <Grid container direction='column' alignItems='flex-start'>
                        <Grid item className={classes.title}>
                          <Typography variant='h3'>Channel Info</Typography>
                        </Grid>
                        <Grid item className={classes.descriptionDiv}>
                          <Typography className={classes.label} variant='body2'>
                            Channel Description
                          </Typography>
                          <TextField
                            name='updateChannelDescription'
                            className={classes.channelDescription}
                            variant='outlined'
                            multiline
                            fullWidth
                            rows={5}
                            value={values.firstName}
                          />
                        </Grid>
                        <Grid item className={classes.checkboxDiv}>
                          <CheckboxWithLabel
                            name='updateOnlyRegistered'
                            label='Allow only registered users to send messages'
                            labelClass={classes.checkboxLabel}
                            rootClass={classes.rootClass}
                          />
                        </Grid>
                        <Grid item className={classes.checkboxDiv}>
                          <CheckboxWithLabel
                            name='updateMinFee'
                            label='Set the price to post an offer (default is 0.00 ZEC)'
                            labelClass={classes.checkboxLabel}
                            rootClass={classes.rootClass}
                          />
                        </Grid>
                        <Grid item className={classes.submitButton}>
                          <Button
                            variant='contained'
                            size='large'
                            color='primary'
                            type='submit'
                            fullWidth
                            disabled={!isValid || isSubmitting}
                            className={classes.button}
                          >
                            Save
                          </Button>
                        </Grid>
                      </Grid>
                    </Form>
                  )
                }}
              </Formik>
            </Grid>
          </Grid>
        </Scrollbars>
      )}
    </AutoSizer>
  )
}

export default ChannelInfo
