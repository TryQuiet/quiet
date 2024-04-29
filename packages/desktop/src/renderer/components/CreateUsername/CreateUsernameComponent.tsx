import React, { useCallback, useState } from 'react'

import { styled } from '@mui/material/styles'
import classNames from 'classnames'

import { Controller, useForm } from 'react-hook-form'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import WarningIcon from '@mui/icons-material/Warning'

import Modal from '../ui/Modal/Modal'

import { LoadingButton } from '../ui/LoadingButton/LoadingButton'

import { TextInput } from '../../forms/components/textInput'

import { userNameField } from '../../forms/fields/createUserFields'

import { parseName } from '@quiet/common'
import { defaultLogger } from '../../logger'

const PREFIX = 'CreateUsernameComponent-'

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
  buttonModern: `${PREFIX}buttonModern`,
  buttonMargin: `${PREFIX}buttonMargin`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
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
    width: 165,
    backgroundColor: theme.palette.colors.quietBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue,
    },
    textTransform: 'none',
    height: 48,
    fontWeight: 'normal',
  },

  [`& .${classes.buttonModern}`]: {
    borderRadius: 8,
    width: 110,
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

interface CreateUserValues {
  userName: string
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
}) => {
  const [userName, setUserName] = useState('')
  const [parsedNameDiffers, setParsedNameDiffers] = useState(false)

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
    control,
  } = useForm<CreateUserValues>({
    mode: 'onTouched',
  })

  const onSubmit = useCallback(
    (values: CreateUserValues) => {
      if (errors.userName) {
        defaultLogger.error('Cannot submit form with errors')
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
    <Modal open={open} handleClose={handleClose} isCloseDisabled={true} testIdPrefix={'createUsername'}>
      <StyledGrid container direction='column'>
        <>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container justifyContent='flex-start' direction='column' className={classes.fullContainer}>
              <Grid>
                <Typography variant='h3' className={classes.title}>
                  Register a username
                </Typography>
                <Typography variant='body2'>Choose your favorite username</Typography>
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
                    spellCheck={false}
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
                        data-testid={'createUserNameWarning'}
                      >
                        Your username will be registered as <b>{`@${userName}`}</b>
                      </Typography>
                    </Grid>
                  </Grid>
                )}
              </div>
              <LoadingButton
                variant='contained'
                color='primary'
                disabled={Boolean(errors.userName)}
                type='submit'
                text={'Register'}
                classes={{
                  button: classNames({
                    [classes.button]: true,
                  }),
                }}
              />
            </Grid>
          </form>
        </>
      </StyledGrid>
    </Modal>
  )
}

export default CreateUsernameComponent
