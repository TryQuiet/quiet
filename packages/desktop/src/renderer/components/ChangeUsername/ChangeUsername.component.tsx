import React, { useCallback, useState } from 'react'

import { styled } from '@mui/material/styles'
import classNames from 'classnames'

import { Controller, useForm } from 'react-hook-form'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

import WarningIcon from '@mui/icons-material/Warning'

import { LoadingButton } from '../ui/LoadingButton/LoadingButton'
import { TextInput } from '../../forms/components/textInput'

import { userNameField } from '../../forms/fields/createUserFields'

import { parseName } from '@quiet/common'

const PREFIX = 'ChangeUsername-'

const classes = {
  focus: `${PREFIX}focus`,
  margin: `${PREFIX}margin`,
  error: `${PREFIX}error`,
  fullContainer: `${PREFIX}fullContainer`,
  gutter: `${PREFIX}gutter`,
  button: `${PREFIX}button`,
  title: `${PREFIX}title`,
  iconDiv: `${PREFIX}iconDiv`,
  warrningIcon: `${PREFIX}warrningIcon`,
  warrningMessage: `${PREFIX}warrningMessage`,
  rootBar: `${PREFIX}rootBar`,
  progressBar: `${PREFIX}progressBar`,
  info: `${PREFIX}info`,
  inputLabel: `${PREFIX}inputLabel`,
  marginMedium: `${PREFIX}marginMedium`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.colors.white,
  padding: '0px 32px',

  [`& .${classes.focus}`]: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.linkBlue,
      },
    },
  },

  [`& .${classes.margin}`]: {
    '& .MuiFormHelperText-contained': {
      margin: '5px 0px',
    },
  },

  [`& .${classes.error}`]: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.red,
      },
    },
  },

  [`& .${classes.fullContainer}`]: {
    width: '100%',
    height: '100%',
  },

  [`& .${classes.gutter}`]: {
    marginTop: 8,
    marginBottom: 24,
  },

  [`& .${classes.button}`]: {
    width: 110,
    height: 48,
    textTransform: 'none',
    fontWeight: 'normal',
    color: theme.palette.colors.white,
    backgroundColor: theme.palette.colors.quietBlue,
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue,
    },
    borderRadius: 8,
  },

  [`& .${classes.title}`]: {
    marginBottom: 24,
  },

  [`& .${classes.iconDiv}`]: {
    width: 24,
    height: 28,
    marginRight: 8,
  },

  [`& .${classes.warrningIcon}`]: {
    color: '#FFCC00',
  },

  [`& .${classes.warrningMessage}`]: {
    wordBreak: 'break-word',
  },

  [`& .${classes.rootBar}`]: {
    width: 350,
    marginTop: 32,
    marginBottom: 16,
  },

  [`& .${classes.progressBar}`]: {
    backgroundColor: theme.palette.colors.linkBlue,
  },

  [`& .${classes.info}`]: {
    lineHeight: '19px',
    color: theme.palette.colors.darkGray,
  },

  [`& .${classes.inputLabel}`]: {
    marginTop: 24,
    marginBottom: 2,
    color: theme.palette.colors.black30,
  },

  [`& .${classes.marginMedium}`]: {
    marginTop: 24,
  },
}))

const userFields = {
  userName: userNameField(),
}

interface ChangeUserNameValues {
  userName: string
}

export interface ChangeUsernameProps {
  open: boolean
  currentUsername?: string
  registerUsername: (name: string) => void
  registrationError?: string | null
}

export const ChangeUsername: React.FC<ChangeUsernameProps> = ({
  open,
  currentUsername,
  registerUsername,
  registrationError,
}) => {
  const [userName, setUserName] = useState('')
  const [parsedNameDiffers, setParsedNameDiffers] = useState(false)

  React.useEffect(() => {
    if (registrationError) {
      setError('userName', { message: registrationError }, { shouldFocus: true })
    }
  }, [registrationError])

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
    control,
  } = useForm<ChangeUserNameValues>({
    mode: 'onTouched',
  })

  const onSubmit = useCallback(
    (values: ChangeUserNameValues) => {
      if (errors.userName) {
        console.error('Cannot submit form with errors')
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
      setValue('userName', '')
      setUserName('')
    }
  }, [open])

  return (
    <StyledGrid container direction='column'>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container justifyContent='flex-start' direction='column' className={classes.fullContainer}>
          <Grid>
            <Typography variant='body2' className={classes.marginMedium} data-testid={'duplicated-username-prompt'}>
              We’re sorry, but the username <strong>{currentUsername && `@${currentUsername}`}</strong> was already
              claimed by someone else. <br />
              Can you choose another name?
            </Typography>

            <Typography variant='body2' className={classes.inputLabel}>
              Enter username
            </Typography>
          </Grid>
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
              />
            )}
          />
          <Grid>
            <Typography variant='caption' style={{ marginTop: 8 }}>
              You can choose any username you like. No spaces or special characters.
            </Typography>
          </Grid>
          <Grid className={classes.gutter}>
            {!errors.userName && userName.length > 0 && parsedNameDiffers && (
              <Grid container alignItems='center' direction='row'>
                <Grid item className={classes.iconDiv}>
                  <WarningIcon className={classes.warrningIcon} />
                </Grid>
                <Grid item xs>
                  <Typography variant='body2' className={classes.warrningMessage}>
                    Your username will be registered as <b>{`@${userName}`}</b>
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Grid>
          <LoadingButton
            type='submit'
            text={'Continue'}
            color='primary'
            variant='contained'
            disabled={Boolean(errors.userName)}
            classes={{
              button: classNames({
                [classes.button]: true,
              }),
            }}
          />
        </Grid>
      </form>
    </StyledGrid>
  )
}

export default ChangeUsername
