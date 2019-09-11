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
import { Divider } from '@material-ui/core'

import IconCopy from '../../ui/IconCopy'
import TextField from '../../ui/form/TextField'

const styles = theme => ({
  fullWidth: {
    width: '100%'
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
  divider: {
    height: 60,
    marginLeft: 10,
    width: 1
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

const formSchema = checkNickname =>
  Yup.object().shape({
    nickname: Yup.string()
      .min(3)
      .max(20)
      .validateMessage(checkNickname)
      .required('Required')
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
    {({ values, isSubmitting, isValid }) => (
      <Form className={classes.fullWidth}>
        <Grid container className={classes.container} spacing={4}>
          <Grid item xs={12}>
            <Typography variant='body2'>Nickname</Typography>
            <TextField
              id='nickname'
              name='nickname'
              className={classes.textField}
              margin='none'
              placeholder={`Sorry you don't have registered nickname`}
              variant='outlined'
              value={values.nickname}
            />
          </Grid>
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
