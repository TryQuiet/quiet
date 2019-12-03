import React from 'react'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import { Formik, Form } from 'formik'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import InputAdornment from '@material-ui/core/InputAdornment'
import MuiTextField from '@material-ui/core/TextField'
import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'
import CopyIcon from '../../../../renderer/static/images/copylink.svg'

import Icon from '../../ui/Icon'
import usernameIcon from '../../../static/images/username.svg'

const styles = theme => ({
  createUsernameContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 24,
    paddingRight: 24,
    borderRadius: 4,
    backgroundColor: theme.palette.colors.veryLightGray
  },
  container: {
    marginTop: theme.spacing(1)
  },
  textField: {
    width: '100%',
    height: 60
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
  link: {
    cursor: 'pointer',
    color: theme.palette.colors.linkBlue
  },
  info: {
    color: theme.palette.colors.darkGray
  },
  title: {
    marginBottom: 24
  },
  iconBackground: {
    margin: 0,
    padding: 0
  },
  iconBox: {
    margin: 0,
    padding: 5,
    width: 60,
    height: 56,
    backgroundColor: theme.palette.colors.gray30
  },
  adornedEnd: {
    padding: 0
  },
  copyInput: {
    borderRight: `1px solid ${theme.palette.colors.inputGray}`,
    paddingTop: 18,
    paddingBottom: 18,
    paddingLeft: 16
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
  openModal,
  closeModal,
  user
}) => {
  return (
    <Grid container direction='column'>
      <Grid item className={classes.title}>
        <Typography variant='h3'>Account</Typography>
      </Grid>
      <Grid container justify='center'>
        <Grid container xs item className={classes.createUsernameContainer}>
          {user ? (
            <Grid item xs={12}>
              <Typography variant='h4'>@{user.nickname}</Typography>
            </Grid>
          ) : (
            <>
              <Grid item xs={12}>
                <Typography variant={'h4'}>Create a username</Typography>
              </Grid>
              <Grid container item direction='row' alignItems='center' justify='space-between'>
                <Grid item xs={10}>
                  <Typography className={classes.info} variant={'body2'}>
                    You need this to send and receive direct messages.
                  </Typography>
                </Grid>
                <Grid container item xs={2} direction='row' justify='flex-end'>
                  <Icon className={classes.usernameIcon} src={usernameIcon} />
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Typography
                  className={classes.link}
                  onClick={() => openCreateUsernameModal(openModal, closeModal)}
                  variant={'body2'}
                >
                  Create username
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </Grid>
      <Formik onSubmit={handleSubmit}>
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
                  classes={{ root: classes.textField }}
                  InputProps={{
                    classes: { input: classes.copyInput, adornedEnd: classes.adornedEnd },
                    endAdornment: (
                      <Grid
                        item
                        container
                        justify={'center'}
                        alignItems={'center'}
                        className={classes.iconBox}
                      >
                        <InputAdornment position='end' className={classes.iconBackground}>
                          <CopyToClipboard text={privateAddress} onCopy={handleCopy}>
                            <IconButton>
                              <Icon src={CopyIcon} />
                            </IconButton>
                          </CopyToClipboard>
                        </InputAdornment>
                      </Grid>
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
                    classes: { input: classes.copyInput, adornedEnd: classes.adornedEnd },
                    endAdornment: (
                      <Grid
                        item
                        container
                        justify={'center'}
                        alignItems={'center'}
                        className={classes.iconBox}
                      >
                        <InputAdornment position='end' className={classes.iconBackground}>
                          <CopyToClipboard text={transparentAddress} onCopy={handleCopy}>
                            <IconButton>
                              <Icon src={CopyIcon} />
                            </IconButton>
                          </CopyToClipboard>
                        </InputAdornment>
                      </Grid>
                    )
                  }}
                />
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </Grid>
  )
}
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
