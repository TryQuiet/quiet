import React, { useState } from 'react'
import { Formik, Form, Field } from 'formik'
import classNames from 'classnames'

import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'

import Modal from '../../ui/Modal/Modal'
import { LoadingButton } from '../../ui/LoadingButton/LoadingButton'

import { CommunityAction } from './community.keys'
import {
  CreateCommunityDictionary,
  JoinCommunityDictionary
} from './PerformCommunityAction.dictionary'

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

const CustomInputComponent = ({
  classes,
  field,
  isTouched,
  form: { errors, values },
  error,
  placeholder,
  ...props
}) => {
  const { value, ...rest } = field
  const formErrors = errors.name || error
  return (
    <TextField
      variant={'outlined'}
      fullWidth
      className={classNames({
        [classes.focus]: true,
        [classes.margin]: true,
        [classes.error]: isTouched && formErrors
      })}
      placeholder={placeholder}
      error={isTouched && formErrors}
      helperText={isTouched && formErrors}
      defaultValue={values.name || ''}
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

export interface PerformCommunityActionProps {
  open: boolean
  communityAction: CommunityAction
  handleCommunityAction: (value: string) => void
  handleRedirection: () => void
  initialValue: string
  registrar?: string
  error?: string
  handleClose: () => void
  isClosedDisabled?: boolean
  isConnectionReady?: boolean
}

export const PerformCommunityActionComponent: React.FC<PerformCommunityActionProps> = ({
  open,
  communityAction,
  handleCommunityAction,
  handleRedirection,
  initialValue,
  registrar,
  error,
  handleClose,
  isClosedDisabled = true,
  isConnectionReady = true
}) => {
  const classes = useStyles({})
  const [isTouched, setTouched] = useState(false)
  const [formSent, setFormSent] = useState(false)
  const responseReceived = Boolean(error || registrar)
  const waitingForResponse = formSent && !responseReceived
  const dictionary =
    communityAction === CommunityAction.Create
      ? CreateCommunityDictionary(handleRedirection)
      : JoinCommunityDictionary(handleRedirection)
  return (
    <Modal open={open} handleClose={handleClose} isCloseDisabled={isClosedDisabled}>
      <Grid container className={classes.main} direction='column'>
        <React.Fragment>
          <Grid className={classes.title} item>
            <Typography variant={'h3'}>{dictionary.header}</Typography>
          </Grid>
          <Formik
            onSubmit={values => submitForm(handleCommunityAction, values, setFormSent)}
            initialValues={initialValue}>
            {() => {
              return (
                <Form className={classes.fullWidth}>
                  <Grid container>
                    <Grid className={classes.field} item xs={12}>
                      <Typography variant='caption' className={classes.label}>
                        {dictionary.label}{' '}
                      </Typography>
                      <Field
                        name='name'
                        classes={classes}
                        component={CustomInputComponent}
                        isTouched={isTouched}
                        error={error}
                        placeholder={dictionary.placeholder}
                      />
                    </Grid>
                    <Grid item xs={12} className={classes.infoDiv}>
                      <Typography variant='caption' className={classes.info}>
                        {dictionary.hint}
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
                        text={dictionary.button ?? 'Continue'}
                        classes={{ button: classes.button }}
                        disabled={waitingForResponse || !isConnectionReady}
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
          {dictionary.redirection}
        </React.Fragment>
      </Grid>
    </Modal>
  )
}

export default PerformCommunityActionComponent
