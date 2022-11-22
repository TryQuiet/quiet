import React, { useState } from 'react'
import classNames from 'classnames'
import { Controller, useForm } from 'react-hook-form'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import { makeStyles } from '@mui/material/styles'

import WarningIcon from '@mui/icons-material/Warning'

import Modal from '../ui/Modal/Modal'
import UsernameCreated from './UsernameCreated/UsernameCreated'

import { LoadingButton } from '../ui/LoadingButton/LoadingButton'
import { TextInput } from '../../forms/components/textInput'
import { userNameField } from '../../forms/fields/createUserFields'

import { parseName } from '@quiet/state-manager'

const useStyles = makeStyles(theme => ({
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
  fullContainer: {
    width: '100%',
    height: '100%'
  },
  gutter: {
    marginTop: 8,
    marginBottom: 24
  },
  button: {
    width: 165,
    backgroundColor: theme.palette.colors.quietBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue
    },
    textTransform: 'none',
    height: 48,
    fontWeight: 'normal'
  },
  title: {
    marginBottom: 24
  },
  iconDiv: {
    width: 24,
    height: 28,
    marginRight: 8
  },
  warrningIcon: {
    color: '#FFCC00'
  },
  warrningMessage: {
    wordBreak: 'break-word'
  },
  rootBar: {
    width: 350,
    marginTop: 32,
    marginBottom: 16
  },
  progressBar: {
    backgroundColor: theme.palette.colors.linkBlue
  },
  info: {
    lineHeight: '19px',
    color: theme.palette.colors.darkGray
  }
}))

const userFields = {
  userName: userNameField()
}

interface CreateUserValues {
  userName: string
}

export interface CreateUsernameComponentProps {
  open: boolean
  registerUsername: (name: string) => void
  certificateRegistrationError?: string
  certificate?: string
  handleClose: () => void
}

export const CreateUsernameComponent: React.FC<CreateUsernameComponentProps> = ({
  open,
  registerUsername,
  certificateRegistrationError,
  certificate,
  handleClose
}) => {
  const classes = useStyles({})

  const [formSent, setFormSent] = useState(false)
  const [userName, setUserName] = useState('')
  const [parsedNameDiffers, setParsedNameDiffers] = useState(false)

  const responseReceived = Boolean(certificateRegistrationError || certificate)
  const waitingForResponse = formSent && !responseReceived

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    control
  } = useForm<CreateUserValues>({
    mode: 'onTouched'
  })

  const onSubmit = (values: CreateUserValues) => {
    submitForm(registerUsername, values, setFormSent)
  }

  const submitForm = (
    handleSubmit: (value: string) => void,
    values: CreateUserValues,
    setFormSent
  ) => {
    setFormSent(true)
    handleSubmit(parseName(values.userName))
  }

  const onChange = (name: string) => {
    const parsedName = parseName(name)
    setUserName(parsedName)
    setParsedNameDiffers(name !== parsedName)
  }

  React.useEffect(() => {
    if (!open) {
      setValue('userName', '')
      setUserName('')
    }
  }, [open])

  React.useEffect(() => {
    if (certificateRegistrationError) {
      setError('userName', { message: certificateRegistrationError })
    }
  }, [certificateRegistrationError])

  return (
    <Modal open={open} handleClose={handleClose} testIdPrefix='createUsername' isCloseDisabled={true}>
      <Grid container className={classes.main} direction='column'>
        {!certificate ? (
          <>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid
                container
                justify='flex-start'
                direction='column'
                className={classes.fullContainer}>
                <Typography variant='h3' className={classes.title}>
                  Register a username
                </Typography>
                <Typography variant='body2'>Choose your favorite username</Typography>
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
                      onPaste={e => e.preventDefault()}
                      variant='outlined'
                      onchange={event => {
                        event.persist()
                        const value = event.target.value
                        onChange(value)
                        // Call default
                        field.onChange(event)
                      }}
                      onblur={() => {
                        field.onBlur()
                      }}
                      value={field.value}
                    />
                  )}
                />
                <div className={classes.gutter}>
                  {!errors.userName && userName.length > 0 && parsedNameDiffers && (
                    <Grid container alignItems='center' direction='row'>
                      <Grid item className={classes.iconDiv}>
                        <WarningIcon className={classes.warrningIcon} />
                      </Grid>
                      <Grid item xs>
                        <Typography
                          variant='body2'
                          className={classes.warrningMessage}
                          data-testid={'createUserNameWarning'}>
                          Your username will be registered as <b>{`@${userName}`}</b>
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </div>
                <LoadingButton
                  variant='contained'
                  color='primary'
                  inProgress={waitingForResponse}
                  disabled={waitingForResponse}
                  type='submit'
                  text={'Register'}
                  classes={{ button: classes.button }}
                />
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

export default CreateUsernameComponent
