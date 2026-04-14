import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'

import { createSvgIcon, FormControlLabel, Grid, Switch, SwitchProps, Typography } from '@mui/material'
import inlineSvg from 'react-inlinesvg'

import WarningIcon from '@mui/icons-material/Warning'

import Modal from '../../ui/Modal/Modal'
import LoadingButton from '../../ui/LoadingButton/LoadingButton'

import { TextField } from '../../ui/TextField/TextField'
import { channelNameField, channelPrivateField } from '../../../forms/fields/createChannelFields'

import lockIconSvg from '../../../static/images/lock.svg'

import { parseName } from '@quiet/common'
import { createLogger } from '../../../logger'
import IOSSwitch from '../../ui/Switch/IOSSwitch'

const logger = createLogger('CreateChannelComponent')

const PREFIX = 'CreateChannelComponent'

const classes = {
  fullContainer: `${PREFIX}fullContainer`,
  gutter: `${PREFIX}gutter`,
  button: `${PREFIX}button`,
  title: `${PREFIX}title`,
  iconDiv: `${PREFIX}iconDiv`,
  warningIcon: `${PREFIX}warningIcon`,
  warningMessage: `${PREFIX}warningMessage`,
  errorMessage: `${PREFIX}errorMessage`,
  rootBar: `${PREFIX}rootBar`,
  progressBar: `${PREFIX}progressBar`,
  info: `${PREFIX}info`,
  publicPrivateGrid: `${PREFIX}publicPrivateGrid`,
  lock: `${PREFIX}lock`,
  publicPrivate: `${PREFIX}publicPrivate`,
  bold: `${PREFIX}bold`,
  offset: `${PREFIX}offset`,
  subtitle: `${PREFIX}subtitle`,
}

const StyledModalContent = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: '0px 32px',

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

  [`& .${classes.title}`]: {
    marginBottom: 24,
  },

  [`& .${classes.iconDiv}`]: {
    width: 24,
    height: 28,
    marginRight: 8,
  },

  [`& .${classes.warningIcon}`]: {
    color: theme.palette.warning.main,
  },

  [`& .${classes.warningMessage}`]: {
    wordBreak: 'break-word',
  },

  [`& .${classes.errorMessage}`]: {
    color: theme.palette.error.main,
    fontSize: 12,
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

  [`& .${classes.publicPrivateGrid}`]: {
    marginLeft: 0,
    alignItems: 'center',
    gap: 8,
  },

  [`& .${classes.lock}`]: {
    padding: 0,
  },

  [`& .${classes.bold}`]: {
    fontWeight: 500,
  },

  [`& .${classes.offset}`]: {
    marginTop: 5,
  },

  [`& .${classes.subtitle}`]: {
    color: theme.palette.colors.gray50,
    fontWeight: 400,
    marginTop: -2,
  },

  [`& .${classes.publicPrivate}`]: {
    marginTop: 0,
  },
}))

const createChannelFields = {
  channelName: channelNameField(),
  private: channelPrivateField(),
}

interface CreateChannelFormValues {
  channelName: string
  private: boolean
}

export interface CreateChannelProps {
  open: boolean
  channelCreationError?: string
  createChannel: (name: string, isPublic: boolean) => void
  handleClose: () => void
  clearErrorsDispatch: () => void
}

export const CreateChannelComponent: React.FC<CreateChannelProps> = ({
  open,
  channelCreationError,
  createChannel,
  handleClose,
  clearErrorsDispatch,
}) => {
  const [channelName, setChannelName] = useState('')
  const [parsedNameDiffers, setParsedNameDiffers] = useState(false)
  const LockIcon = createSvgIcon(inlineSvg({ src: lockIconSvg }) as React.ReactElement, 'Lock')

  const { handleSubmit, formState, setValue, setError, clearErrors, control } = useForm<{
    channelName: string
    private: boolean
  }>({
    mode: 'onSubmit',
  })

  const onSubmit = (values: CreateChannelFormValues) => {
    logger.error('submitting!', values)
    submitForm(createChannel, values)
  }

  const submitForm = (handleSubmit: (name: string, isPublic: boolean) => void, values: CreateChannelFormValues) => {
    handleSubmit(parseName(values.channelName), !values.private)
  }

  const onNameChange = (name: string) => {
    setValue('channelName', name)
    const parsedName = parseName(name)
    setChannelName(parsedName)
    setParsedNameDiffers(name !== parsedName)
  }

  const onIsPrivateChange = (checked: boolean) => {
    setValue('private', checked)
  }

  React.useEffect(() => {
    if (!open) {
      setValue('channelName', '')
      setChannelName('')
      setValue('private', false)
      clearErrors()
      clearErrorsDispatch()
    } else {
      setValue('private', false)
    }
  }, [open])

  React.useEffect(() => {
    if (channelCreationError) {
      setError('channelName', { message: channelCreationError })
    }
  }, [channelCreationError])

  return (
    <Modal open={open} handleClose={handleClose} data-testid={'createChannelModal'}>
      <StyledModalContent container direction='column'>
        <form
          onSubmit={handleSubmit(onSubmit, errors => {
            logger.error(
              'Errors on submit',
              JSON.stringify(errors.channelName, null, 2),
              JSON.stringify(errors.private, null, 2)
            )
          })}
        >
          <Grid container justifyContent='flex-start' direction='column' className={classes.fullContainer}>
            <Typography variant='h3' className={classes.title}>
              Create a new channel
            </Typography>
            <Typography variant='body2'>Channel name</Typography>
            <Controller
              control={control}
              defaultValue={''}
              rules={createChannelFields.channelName.validation}
              name={'channelName'}
              render={({ field }) => (
                <TextField
                  {...createChannelFields.channelName.fieldProps}
                  fullWidth
                  classes={''}
                  variant='outlined'
                  placeholder={'Enter a channel name'}
                  autoFocus
                  errors={formState.errors}
                  onchange={event => {
                    event.persist()
                    const value = event.target.value
                    onNameChange(value)
                    // Call default
                    field.onChange(event)
                  }}
                  onblur={() => {
                    field.onBlur()
                  }}
                  value={field.value}
                  data-testid={'createChannelInput'}
                />
              )}
            />
            <div className={classes.gutter}>
              {!formState.errors.channelName && channelName.length > 0 && parsedNameDiffers && (
                <Grid container alignItems='center' direction='row'>
                  <Grid item className={classes.iconDiv}>
                    <WarningIcon className={classes.warningIcon} />
                  </Grid>
                  <Grid item xs>
                    <Typography
                      variant='body2'
                      className={classes.warningMessage}
                      data-testid={'createChannelNameWarning'}
                    >
                      Your channel will be created as <b>{`#${channelName}`}</b>
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </div>
            <Controller
              control={control}
              name={'private'}
              rules={createChannelFields.private.validation}
              render={({ field }) => (
                <Grid item container direction='row' className={classes.publicPrivateGrid}>
                  <LockIcon className={classes.lock} data-testid={'createChannel-private-lockIcon'} />
                  <Grid item className={classes.publicPrivate} alignItems='center'>
                    <FormControlLabel
                      defaultChecked={false}
                      data-testid={'createChannel-private-form-control'}
                      control={
                        <IOSSwitch
                          checked={field.value}
                          data-testid={'createChannel-private-form-control-toggle'}
                          onChange={event => {
                            event.persist()
                            onIsPrivateChange(event.target.checked)
                            field.onChange(event.target.checked)
                          }}
                        />
                      }
                      label={
                        <Grid
                          container
                          direction='column'
                          justifyContent='left'
                          alignContent='center'
                          paddingRight='18px'
                          data-testid={'createChannel-private-form-control-label'}
                        >
                          <Grid item>
                            <Typography variant='body1'>Private Channel</Typography>
                          </Grid>
                          <Grid item>
                            <Typography variant='caption' className={classes.subtitle}>
                              Only assigned members and roles have access
                            </Typography>
                          </Grid>
                        </Grid>
                      }
                      labelPlacement='start'
                    />
                  </Grid>
                </Grid>
              )}
            />
            <div className={classes.gutter}>
              {formState.errors.private && (
                <Grid container alignItems='center' direction='row'>
                  <Grid item xs>
                    <Typography
                      variant='body2'
                      className={classes.errorMessage}
                      data-testid={'createChannelPrivacyWarning'}
                    >
                      {formState.errors.private.message}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </div>
            <LoadingButton
              variant='contained'
              color='primary'
              inProgress={false}
              type='submit'
              text='Create Channel'
              classes={{ button: classes.button }}
              data-testid='channelNameSubmit'
            />
          </Grid>
        </form>
      </StyledModalContent>
    </Modal>
  )
}

export default CreateChannelComponent
