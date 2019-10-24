import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import { Formik, Form } from 'formik'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import InputAdornment from '@material-ui/core/InputAdornment'
import MuiTextField from '@material-ui/core/TextField'
import IconButton from '@material-ui/core/IconButton'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'
import { Divider } from '@material-ui/core'

import Icon from '../../ui/Icon'
import usernameIcon from '../../../static/images/username.svg'
import IconCopy from '../../ui/IconCopy'

const styles = theme => ({
  fullWidth: {
    width: 570
  },
  mainCreateUsernameContainer: {
    marginTop: 25
  },
  createUsernameContainer: {
    width: 522,
    height: 115,
    borderRadius: 4,
    backgroundColor: theme.palette.colors.veryLightGray
  },
  container: {
    padding: theme.spacing(3),
    marginTop: theme.spacing(1)
  },
  textField: {
    width: '100%',
    height: 60,
    '& > :first-child': {
      padding: theme.spacing(1)
    }
  },
  icon: {
    width: 60,
    height: 60,
    justifyContent: 'center'
  },
  usernameIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center'
  },
  buttonDiv: {
    marginTop: theme.spacing(1)
  },
  button: {
    backgroundColor: theme.palette.colors.purple,
    padding: theme.spacing(2),
    '&:hover': {
      backgroundColor: theme.palette.colors.darkPurple
    },
    '&:disabled': {
      backgroundColor: 'theme.palette.colors.gray'
    }
  },
  link: {
    cursor: 'pointer',
    color: theme.palette.colors.linkBlue
  },
  info: {
    color: theme.palette.colors.darkGray
  }
})

Yup.addMethod(Yup.mixed, 'validateMessage', function (checkNickname) {
  return this.test('test', 'Sorry username already taken. please choose another', async function (
    value
  ) {
    const isUsernameTaken = await checkNickname(value)
    return !isUsernameTaken
  })
})

const openCreateUsernameModal = (openModal, closeModal) => {
  closeModal()
  openModal()
}

export const AccountSettingsForm = ({
  classes,
  transparentAddress,
  privateAddress,
  handleCopy,
  handleSubmit,
  checkNickname,
  updateDonation,
  donationAllow,
  openModal,
  closeModal
}) => (
  <Fragment>
    <Grid container spacing={4} className={classes.mainCreateUsernameContainer} direction='row' justify='center'>
      <Grid container item className={classes.createUsernameContainer}>
        <Grid item xs={12}>
          <Typography variant={'h4'}>Create a username</Typography>
        </Grid>
        <Grid container item direction='row' alignItems='center' justify='space-between'>
          <Grid item xs={10}>
            <Typography className={classes.info} variant={'body2'}>You need this to send and receive direct messages.</Typography>
          </Grid>
          <Grid container item xs={2} direction='row' justify='flex-end'>
            <Icon className={classes.usernameIcon} src={usernameIcon} />
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Typography className={classes.link} onClick={() => openCreateUsernameModal(openModal, closeModal)} variant={'body2'}>Create username</Typography>
        </Grid>
      </Grid>
    </Grid>
    <Formik
      onSubmit={handleSubmit}
    >
      {({ values, isSubmitting, isValid }) => (
        <Form className={classes.fullWidth}>
          <Grid container className={classes.container} spacing={4}>
            <Grid item xs={12}>
              <Typography variant='body2'>Private address</Typography>
              <MuiTextField
                id='private-address'
                className={classes.textField}
                variant='outlined'
                type='text'
                value={privateAddress}
                disabled
                classes={{ root: classes.textFieldd }}
                InputProps={{
                  endAdornment: (
                  <>
                    <Divider className={classes.divider} orientation='vertical' />
                    <InputAdornment position='end' className={classes.icon}>
                      <IconButton>
                        <CopyToClipboard text={privateAddress} onCopy={handleCopy}>
                          <IconCopy />
                        </CopyToClipboard>
                      </IconButton>
                    </InputAdornment>
                  </>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant='body2'>Transparent address</Typography>
              <MuiTextField
                id='transparent-address'
                className={classes.textField}
                variant='outlined'
                type='text'
                value={transparentAddress}
                disabled
                InputProps={{
                  endAdornment: (
                  <>
                    <Divider className={classes.divider} orientation='vertical' />
                    <InputAdornment position='end' className={classes.icon}>
                      <IconButton>
                        <CopyToClipboard text={transparentAddress} onCopy={handleCopy}>
                          <IconCopy />
                        </CopyToClipboard>
                      </IconButton>
                    </InputAdornment>
                  </>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} className={classes.buttonDiv}>
              <Button
                variant='contained'
                size='small'
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
      )}
    </Formik>
  </Fragment>
)

AccountSettingsForm.propTypes = {
  classes: PropTypes.object.isRequired,
  initialValues: PropTypes.shape({
    nickname: PropTypes.string
  }),
  transparentAddress: PropTypes.string.isRequired,
  privateAddress: PropTypes.string.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleCopy: PropTypes.func,
  checkNickname: PropTypes.func
}

AccountSettingsForm.defaultProps = {
  initialValues: {
    nickname: ''
  }
}

export default withStyles(styles)(AccountSettingsForm)
