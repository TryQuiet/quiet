import React, { useCallback, useState } from 'react'

import { styled } from '@mui/material/styles'
import classNames from 'classnames'

import { Controller, useForm } from 'react-hook-form'

import Typography from '@mui/material/Typography'
import WarningIcon from '@mui/icons-material/Warning'

import Modal from '../ui/Modal/Modal'

import { LoadingButton } from '../ui/LoadingButton/LoadingButton'

import { TextField } from '../ui/TextField/TextField'

import { userNameField } from '../../forms/fields/createUserFields'

import { parseName } from '@quiet/common'

import { OnboardingBody } from '../Onboarding/OnboardingBody'
import { createLogger } from '../../logger'

const logger = createLogger('createUsername:component')

const PREFIX = 'CreateUsernameComponent-'

const classes = {
  focus: `${PREFIX}focus`,
  margin: `${PREFIX}margin`,
  error: `${PREFIX}error`,
  button: `${PREFIX}button`,
  inputLabel: `${PREFIX}inputLabel`,
  helper: `${PREFIX}helper`,
  warning: `${PREFIX}warning`,
  warningIcon: `${PREFIX}warningIcon`,
  warningMessage: `${PREFIX}warningMessage`,
}

const Form = styled('form')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.space.xl,

  [`& .${classes.focus}`]: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.linkBlue,
      },
    },
  },

  [`& .${classes.margin}`]: {
    '& .MuiFormHelperText-contained': {
      margin: `${theme.space.xs}px 0px`,
    },
  },

  [`& .${classes.error}`]: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.red,
      },
    },
  },

  [`& .${classes.button}`]: {
    width: '100%',
    maxWidth: 'none',
    borderRadius: 8,
    backgroundColor: theme.palette.colors.quietBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue,
    },
    textTransform: 'none',
    height: 48,
    fontWeight: 'normal',
  },

  [`& .${classes.inputLabel}`]: {
    display: 'block',
    marginBottom: theme.space.xs,
    color: theme.palette.colors.gray70,
  },

  [`& .${classes.helper}`]: {
    display: 'block',
    marginTop: theme.space.xs,
    color: theme.palette.colors.darkGray,
  },

  [`& .${classes.warning}`]: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.space.sm,
  },

  [`& .${classes.warningIcon}`]: {
    color: theme.palette.warning.main,
  },

  [`& .${classes.warningMessage}`]: {
    wordBreak: 'break-word',
  },
}))

const userFields = {
  userName: userNameField(),
}

interface CreateUserValues {
  userName: string
}

export interface CreateUsernameBodyProps {
  open?: boolean
  registerUsername: (name: string) => void
}

/**
 * Choose username · Figma 2811:2371 (the prototype's copy and layout; the
 * library's "Register username" is stale). Validation, the parsed-name warning
 * and the error states are the app's existing behaviour.
 */
export const CreateUsernameBody: React.FC<CreateUsernameBodyProps> = ({ open = true, registerUsername }) => {
  const [userName, setUserName] = useState('')
  const [parsedNameDiffers, setParsedNameDiffers] = useState(false)

  const {
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    control,
    reset,
  } = useForm<CreateUserValues>({
    mode: 'onTouched',
  })

  const onSubmit = useCallback(
    (values: CreateUserValues) => {
      if (errors.userName) {
        logger.error('Cannot submit form with errors')
        return
      }

      const parsedName = parseName(values.userName)
      registerUsername(parsedName)
    },
    [errors]
  )

  const onChange = (name: string) => {
    clearErrors('userName')

    const parsedName = parseName(name)
    setUserName(parsedName)

    setParsedNameDiffers(name !== parsedName)
  }

  React.useEffect(() => {
    if (!open) {
      reset()
      setUserName('')
      setParsedNameDiffers(false)
    }
  }, [open])

  return (
    <OnboardingBody heading={'Choose username'} dataTestId='choose-username'>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Typography variant='body2' className={classes.inputLabel} component='label' htmlFor='userName'>
            Enter a username
          </Typography>
          <Controller
            control={control}
            defaultValue={''}
            rules={userFields.userName.validation}
            name={'userName'}
            render={({ field }) => (
              <TextField
                {...userFields.userName.fieldProps}
                id='userName'
                fullWidth
                classes={classNames({
                  [classes.focus]: true,
                  [classes.margin]: true,
                  [classes.error]: errors.userName,
                })}
                placeholder={'Username'}
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
                spellCheck={false}
                autoFocus
              />
            )}
          />
          <Typography variant='caption' className={classes.helper} data-testid={'createUsernameHelper'}>
            Your username will be public, but you can choose any name you like. No spaces or special characters.
            Lowercase letters and numbers only.
          </Typography>
        </div>
        {!errors.userName && userName.length > 0 && parsedNameDiffers ? (
          <div className={classes.warning}>
            <WarningIcon className={classes.warningIcon} />
            <Typography variant='body2' className={classes.warningMessage} data-testid={'createUserNameWarning'}>
              Your username will be registered as <b>{`@${userName}`}</b>
            </Typography>
          </div>
        ) : null}
        <LoadingButton
          variant='contained'
          color='primary'
          disabled={Boolean(errors.userName)}
          type='submit'
          text={'Continue'}
          data-testid={'continue-createUsername'}
          classes={{
            button: classes.button,
          }}
        />
      </Form>
    </OnboardingBody>
  )
}

export interface CreateUsernameComponentProps {
  open: boolean
  handleClose: () => void
  registerUsername: (name: string) => void
}

export const CreateUsernameComponent: React.FC<CreateUsernameComponentProps> = ({
  open,
  registerUsername,
  handleClose,
}) => (
  <Modal
    open={open}
    handleClose={handleClose}
    title={'Create a community'}
    isCloseDisabled={false}
    alignCloseLeft
    contentWidth={'100%'}
    testIdPrefix={'createUsername'}
  >
    <CreateUsernameBody open={open} registerUsername={registerUsername} />
  </Modal>
)

export default CreateUsernameComponent
