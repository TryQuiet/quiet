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
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'

import FileCopyIcon from '@material-ui/icons/FileCopy'

import TextField from '../../ui/form/TextField'

const styles = theme => ({
  fullWidth: {
    width: '100%'
  },
  container: {
    padding: theme.spacing.unit * 6
  },
  textField: {
    width: 270
  },
  submitButton: {
    marginTop: theme.spacing.unit * 3
  }
})

Yup.addMethod(Yup.mixed, 'validateMessage', function (checkNickname) {
  return this.test('test', 'Sorry username already taken. please choose another', async function (value) {
    const isUsernameTaken = await checkNickname(value)
    return !isUsernameTaken
  })
})

const formSchema = (checkNickname) => Yup.object().shape({
  nickname: Yup.string().min(3).max(20).validateMessage(checkNickname).required('Required')
})

export const AccountSettingsForm = ({
  classes,
  initialValues,
  transparentAddress,
  privateAddress,
  handleCopy,
  handleSubmit,
  checkNickname
}) => (
  <Formik
    onSubmit={handleSubmit}
    validationSchema={formSchema(checkNickname)}
    initialValues={initialValues}
  >
    {
      ({ values, isSubmitting, isValid }) => (
        <Form className={classes.fullWidth}>
          <Grid
            container
            direction='column'
            spacing={16}
            alignItems='flex-start'
            className={classes.container}
          >
            <Grid item>
              <Typography variant='body2'>
                {initialValues.nickname ? `You have registered username: ${initialValues.nickname}` : `You don't have a Zbay nickname registered` }
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant='body2'>
                Nickname
              </Typography>
              <TextField
                id='nickname'
                name='nickname'
                className={classes.textField}
                margin='none'
                variant='outlined'
                value={values.nickname}
              />
            </Grid>
            <Grid item container direction='row' justify='space-between'>
              <Grid item>
                <Typography variant='body2'>
                  Private address
                </Typography>
                <MuiTextField
                  id='private-address'
                  className={classes.textField}
                  variant='outlined'
                  type='text'
                  value={privateAddress}
                  disabled
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <CopyToClipboard text={privateAddress} onCopy={handleCopy}>
                          <IconButton>
                            <FileCopyIcon />
                          </IconButton>
                        </CopyToClipboard>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item>
                <Typography variant='body2'>
                  Transparent address
                </Typography>
                <MuiTextField
                  id='transparent-address'
                  className={classes.textField}
                  variant='outlined'
                  type='text'
                  value={transparentAddress}
                  disabled
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <CopyToClipboard text={transparentAddress} onCopy={handleCopy}>
                          <IconButton>
                            <FileCopyIcon />
                          </IconButton>
                        </CopyToClipboard>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            </Grid>
            <Grid item className={classes.submitButton}>
              <Button
                variant='contained'
                size='small'
                color='primary'
                type='submit'
                disabled={!isValid || isSubmitting}
              >
                Save
              </Button>
            </Grid>
          </Grid>
        </Form>
      )
    }
  </Formik>
)

AccountSettingsForm.propTypes = {
  classes: PropTypes.object.isRequired,
  initialValues: PropTypes.shape({
    nickname: PropTypes.string.isRequired
  }).isRequired,
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
