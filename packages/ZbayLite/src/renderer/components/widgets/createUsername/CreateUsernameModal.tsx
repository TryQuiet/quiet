import React, { useState } from 'react'
import classNames from 'classnames'
import { Controller, useForm } from 'react-hook-form'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'

import Modal from '../../ui/Modal/Modal'
import UsernameCreated from './UsernameCreated'
import { LoadingButton } from '../../ui/LoadingButton/LoadingButton'
import { TextInput } from '../../../forms/components/textInput'
import { userNameField } from '../../../forms/fields/createUserFields'

const useStyles = makeStyles(theme => ({
  root: {},
  focus: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.linkBlue
      }
    }
  },
  margin: {
    '& .MuiFormHelperText-contained': {
      margin: '5px 0px'
    }
  },
  error: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.red
      }
    }
  },
  main: {
    backgroundColor: theme.palette.colors.white,
    padding: '0px 32px'
  },
  title: {
    marginTop: 24
  },
  fullWidth: {
    paddingBottom: 25
  },
  note: {
    fontSize: 14,
    lineHeight: '20px',
    color: theme.palette.colors.black30
  },
  field: {
    marginTop: 18
  },
  buttonDiv: {
    marginTop: 24
  },
  info: {
    lineHeight: '18px',
    color: theme.palette.colors.darkGray,
    letterSpacing: 0.4
  },
  button: {
    width: 139,
    height: 60,
    backgroundColor: theme.palette.colors.purple,
    padding: theme.spacing(2),
    '&:hover': {
      backgroundColor: theme.palette.colors.darkPurple
    },
    '&:disabled': {
      backgroundColor: theme.palette.colors.lightGray,
      color: 'rgba(255,255,255,0.6)'
    }
  },
  closeModal: {
    backgroundColor: 'transparent',
    height: 60,
    fontSize: 16,
    lineHeight: '19px',
    color: theme.palette.colors.darkGray,
    '&:hover': {
      backgroundColor: 'transparent'
    }
  },
  buttonContainer: {
    marginBottom: 49
  },
  label: {
    fontSize: 12,
    color: theme.palette.colors.black30
  },
  link: {
    cursor: 'pointer',
    color: theme.palette.colors.linkBlue
  },
  spacing24: {
    marginTop: 24
  },
  infoDiv: {
    lineHeight: 'initial',
    marginTop: 8
  }
}))

interface CreateUsernameModalProps {
  open: boolean
  initialValue: string
  handleRegisterUsername?: (payload: { nickname: string }) => void
  certificateRegistrationError?: string
  certificate?: string
  handleClose: () => void
}

interface CreateUserValues {
  userName: string
}

const userFields = {
  userName: userNameField()
}

const submitForm = (handleRegisterUsername, values: CreateUserValues, setFormSent) => {
  setFormSent(true)
  handleRegisterUsername({ nickname: values.userName })
}

export const CreateUsernameModal: React.FC<CreateUsernameModalProps> = ({
  open,
  initialValue,
  handleRegisterUsername,
  certificateRegistrationError,
  certificate,
  handleClose
}) => {
  const classes = useStyles({})
  const [formSent, setFormSent] = useState(false)
  const responseReceived = Boolean(certificateRegistrationError || certificate)
  const waitingForResponse = formSent && !responseReceived

  const { handleSubmit, formState: { errors }, setError, control } = useForm<CreateUserValues>({
    mode: 'onTouched'
  })

  const onSubmit = (values: CreateUserValues) => submitForm(handleRegisterUsername, values, setFormSent)

  React.useEffect(() => {
    if (certificateRegistrationError) {
      setError('userName', { message: certificateRegistrationError })
    }
  }, [certificateRegistrationError])

  return (
    <Modal open={open} handleClose={handleClose} testIdPrefix='createUsername'>
      <Grid container className={classes.main} direction='column'>
        {!certificate ? (
          <>
            <Grid className={classes.title} item>
              <Typography variant={'h3'}>Register a username</Typography>
            </Grid>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container>
                <Grid className={classes.field} item xs={12}>
                  <Typography variant='caption' className={classes.label}>
                    Choose your favorite username:{' '}
                  </Typography>
                  <Controller
                    control={control}
                    defaultValue={''}
                    rules={userFields.userName.validation}
                    name={'userName'}
                    render={({ field }) => (
                      <TextInput
                        {...userFields.userName.fieldProps}
                        fullWidth
                        classes={classNames({
                          [classes.focus]: true,
                          [classes.margin]: true,
                          [classes.error]: errors.userName
                        })}
                        placeholder={'Enter a username'}
                        errors={errors}
                        defaultValue={initialValue || ''}
                        onPaste={e => e.preventDefault()}
                        variant='outlined'
                        onchange={field.onChange}
                        onblur={field.onBlur}
                        value={field.value}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} className={classes.infoDiv}>
                  <Typography variant='caption' className={classes.info}>
                    Your username cannot have any spaces or special characters, must be
                    lowercase letters and numbers only.
                  </Typography>
                </Grid>
              </Grid>
              <Grid container direction={'row'} justify={'flex-start'} spacing={2}>
                <Grid item xs={'auto'} className={classes.buttonDiv}>
                  <LoadingButton
                    type='submit'
                    variant='contained'
                    size='small'
                    color='primary'
                    fullWidth
                    text={'Continue'}
                    classes={{ button: classes.button }}
                    disabled={waitingForResponse}
                    inProgress={waitingForResponse}
                  />
                </Grid>
              </Grid>
            </form>

          </>
        ) : (
          <UsernameCreated handleClose={handleClose} setFormSent={setFormSent} />
        )}
      </Grid>
    </Modal>
  )
}

export default CreateUsernameModal
