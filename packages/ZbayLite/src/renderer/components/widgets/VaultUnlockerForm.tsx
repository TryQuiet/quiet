import React, { useState } from 'react'
import * as Yup from 'yup'
import { Formik, Form } from 'formik'
import { Redirect } from 'react-router'
import classNames from 'classnames'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'

import Icon from '../ui/Icon/Icon'
import LoadingButton from '../ui/LoadingButton/LoadingButton'

import icon from '../../static/images/zcash/logo-lockup--circle.svg'

const useStyles = makeStyles((theme) => ({
  paper: {
    width: '100vw',
    height: '100vh',
    padding: 20,
    WebkitAppRegion: process.platform === 'win32' ? 'no-drag' : 'drag'
  },
  icon: {
    width: 285,
    height: 67
  },
  logoContainer: {
    height: 167
  },
  passwordField: {
    width: 286
  },
  title: {
    textAlign: 'center',
    width: 456,
    fontSize: 14,
    color: theme.palette.colors.black30,
    lineHeight: '20px'
  },
  torDiv: {
    marginTop: -8
  },
  status: {
    width: '100%',
    textAlign: 'center'
  },
  progressBar: {
    backgroundColor: theme.palette.colors.linkBlue
  },
  rootBar: {
    width: 250
  },
  moreOptionsButton: {
    color: theme.palette.colors.lushSky
  },
  carouselContainer: {
    width: 450,
    height: 100
  },
  existingUser: {
    fontSize: 24,
    lineHeight: '36px',
    color: theme.palette.colors.trueBlack,
    margin: 0
  }
}))

const formSchema = Yup.object().shape({
  password: Yup.string().required('Required')
})

interface VaultUnlockerFormProps {
  onSubmit: (arg) => void
  isNewUser: boolean
}

export const VaultUnlockerForm: React.FC<VaultUnlockerFormProps> = ({
  onSubmit,
  isNewUser
}) => {
  const classes = useStyles({})
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production'
  const [done, setDone] = useState(true)
  const [syncingStart, setSyncingStart] = useState(false)

  React.useEffect(() => {
    setSyncingStart(true)
    onSubmit(setDone)
  }, [])
  return (
    <Formik
      initialValues={{}}
      onSubmit={() => { }}
      validationSchema={isDev ? null : formSchema}
    >
      <Form>
        <Grid
          direction='column'
          spacing={!isNewUser ? 4 : 6}
          alignItems='center'
          alignContent='center'>
          <Grid
            className={classes.logoContainer}
            container
            item
            xs={12}
            justify='center'
            alignItems='center'
            alignContent='center'>
            <Icon className={classes.icon} src={icon} />
          </Grid>
          <Grid container item xs={12} wrap='wrap' justify='center'>
            <Typography
              className={classNames({
                [classes.title]: true,
                [classes.existingUser]: !isNewUser
              })}
              variant='body1'
              gutterBottom>
              {!isNewUser ? 'Welcome Back' : 'Welcome to Zbay!'}
            </Typography>
          </Grid>
          <Grid container item justify='center'>
            <LoadingButton
              type='submit'
              variant='contained'
              size='large'
              color='primary'
              margin='normal'
              fullWidth
              text={!isNewUser ? 'Sign in' : 'Connect Now'}
              disabled={!done || syncingStart}
              inProgress={!done || syncingStart}
            />
          </Grid>
        </Grid>
        <Redirect to='/main/channel/general' />
      </Form>
    </Formik>
  )
}

export default VaultUnlockerForm
