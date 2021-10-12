import React, { useState } from 'react'
import * as Yup from 'yup'
import { Formik, Form, Field } from 'formik'
import classNames from 'classnames'

import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'

import Modal from '../../ui/Modal/Modal'
import UsernameCreated from './UsernameCreated'
import { LoadingButton } from '../../ui/LoadingButton/LoadingButton'
import { Identity } from '@zbayapp/nectar/lib/sagas/identity/identity.slice'
import { ErrorState } from '@zbayapp/nectar/lib/sagas/errors/errors.slice'

const useStyles = makeStyles((theme) => ({
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

const sanitize = (x: string) => (x ? x.replace(/[^a-zA-Z0-9]+$/g, '').toLowerCase() : undefined)

const getValidationSchema = () => {
  return Yup.object().shape({
    nickname: Yup.string()
      .min(3)
      .max(20)
      .matches(/^[a-zA-Z0-9]+$/, {
        message:
          'Your username cannot have any spaces or special characters, must be lowercase letters and numbers only',
        excludeEmptyString: true
      })
      .required('Required')
  })
}

const CustomInputComponent = ({
  classes,
  field,
  isTouched,
  form: { errors, values },
  certificateRegistrationError,
  ...props
}) => {
  const { value, ...rest } = field
  const updatedValue = sanitize(value)
  const nicknameErrors = errors.nickname || certificateRegistrationError
  return (
    <TextField
      variant={'outlined'}
      fullWidth
      className={classNames({
        [classes.focus]: true,
        [classes.margin]: true,
        [classes.error]: isTouched && nicknameErrors
      })}
      placeholder={'Enter a username'}
      error={isTouched && nicknameErrors}
      helperText={isTouched && nicknameErrors}
      value={updatedValue}
      defaultValue={values.nickname || ''}
      {...rest}
      {...props}
      onPaste={e => e.preventDefault()}
    />
  )
}

const submitForm = (handleSubmit, values, setFormSent) => {
  setFormSent(true)
  handleSubmit(values)
}

interface CreateUsernameModalProps {
  handleClose: () => void
  initialValue: string
  handleCreateCommunity?: (val: string) => void
  handleJoinCommunity?: (val: string) => void
  handleLaunchCommunity?: (val: string) => void
  handleLaunchRegistrar?: (val: string) => void
  handleRegisterUsername?: (val: string) => void
  certificateRegistrationError?: ErrorState
  certificate?: string
  id?: Identity
  triggerSelector?: () => void
  open?: boolean
  handleOpen?: () => void
}

export const CreateUsernameModal: React.FC<CreateUsernameModalProps> = ({
  handleClose,
  initialValue,
  handleCreateCommunity,
  handleJoinCommunity,
  handleLaunchCommunity,
  handleLaunchRegistrar,
  handleRegisterUsername,
  certificateRegistrationError,
  certificate,
  id
}) => {
  const classes = useStyles({})
  const [isTouched, setTouched] = useState(false)
  const [formSent, setFormSent] = useState(false)
  const [val, setVal] = useState('')
  const responseReceived = Boolean(certificateRegistrationError || certificate)
  const waitingForResponse = formSent && !responseReceived
  const trig = () => {
    console.log(id)
  }
  return (
    <Modal open={!certificate} handleClose={handleClose} isCloseDisabled={!certificate}>
      <Grid container className={classes.main} direction='column'>
        {!certificate ? (
          <React.Fragment>
            <Grid className={classes.title} item>
              <Typography variant={'h3'}>Register a username</Typography>
              <input
                type='text'
                name='topicBox'
                placeholder='Enter topic here...'
                value={val}
                onChange={target => {
                  console.log(target)
                  setVal(target.target.value)
                }}
              />
              <Button
                onClick={() => {
                  handleCreateCommunity(val)
                }}>
                create community
              </Button>
              <Button onClick={trig}>trigger selector</Button>
              <Button
                onClick={() => {
                  handleJoinCommunity(val)
                }}>
                join community
              </Button>
              <Button
                onClick={() => {
                  handleLaunchCommunity(val)
                }}>
                launch community
              </Button>
              <Button
                onClick={() => {
                  handleLaunchRegistrar(val)
                }}>
                launch registrar
              </Button>
              <Button
                onClick={() => {
                  handleRegisterUsername(val)
                }}>
                register username
              </Button>
            </Grid>
            <Formik
              onSubmit={values => submitForm(handleRegisterUsername, values, setFormSent)}
              initialValues={initialValue}
              validationSchema={() => getValidationSchema()}>
              {() => {
                return (
                  <Form className={classes.fullWidth}>
                    <Grid container>
                      <Grid className={classes.field} item xs={12}>
                        <Typography variant='caption' className={classes.label}>
                          Choose your favorite username:{' '}
                        </Typography>
                        <Field
                          name='nickname'
                          classes={classes}
                          component={CustomInputComponent}
                          isTouched={isTouched}
                          certificateRegistrationError={certificateRegistrationError}
                        />
                      </Grid>
                      <Grid item xs={12} className={classes.infoDiv}>
                        <Typography variant='caption' className={classes.info}>
                          Your username cannot have any spaces or special characters, must be
                          lowercase letters and numbers only.
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid
                      container
                      direction={'row'}
                      justify={'flex-start'}
                      spacing={2}>
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
                          onClick={() => {
                            setTouched(true)
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Form>
                )
              }}
            </Formik>
          </React.Fragment>
        ) : (
          <UsernameCreated handleClose={handleClose} setFormSent={setFormSent} />
        )}
      </Grid>
    </Modal>
  )
}

export default CreateUsernameModal
