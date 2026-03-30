import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'

import { Checkbox, FormControlLabel, Grid, Typography } from '@mui/material'

import WarningIcon from '@mui/icons-material/Warning'

import Modal from '../../ui/Modal/Modal'
import LoadingButton from '../../ui/LoadingButton/LoadingButton'

import { TextField } from '../../ui/TextField/TextField'
import { channelNameField, channelPublicPrivateField } from '../../../forms/fields/createChannelFields'

import radioChecked from '../../../static/images/radioChecked.svg'
import radioUnselected from '../../../static/images/radioUnselected.svg'

import { parseName } from '@quiet/common'
import Icon from '../../ui/Icon/Icon'
import { createLogger } from '../../../logger'

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
  rootBar: `${PREFIX}rootBar`,
  progressBar: `${PREFIX}progressBar`,
  info: `${PREFIX}info`,
  radioDiv: `${PREFIX}radioDiv`,
  radioIcon: `${PREFIX}radioIcon`,
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

  [`& .${classes.radioDiv}`]: {
    marginLeft: 4,
  },

  [`& .${classes.radioIcon}`]: {
    alignItems: 'flex-start',
    '& .MuiCheckbox-root': {
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'transparent',
      },
      display: 'block',
    },
    '& .MuiIconButton-colorSecondary': {
      color: theme.palette.colors.quietBlue,
    },
    '& .MuiTypography-body1': {
      fontSize: '14px',
      lineHeight: '25px',
    },
  },

  [`& .${classes.bold}`]: {
    fontWeight: 500,
  },

  [`& .${classes.offset}`]: {
    marginTop: 5,
  },

  [`& .${classes.subtitle}`]: {
    fontSize: 18,
    lineHeight: '27px',
  },

  [`& .${classes.publicPrivate}`]: {
    marginTop: 16,
  },
}))

const createChannelFields = {
  channelName: channelNameField(),
  public: channelPublicPrivateField('public'),
  private: channelPublicPrivateField('private'),
}

interface CreateChannelFormValues {
  channelName: string
  public: string
  private: string
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
  const [isChannelPublic, setIsChannelPublic] = useState<boolean>(false)
  const [isChannelPrivate, setIsChannelPrivate] = useState<boolean>(false)

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
    control,
  } = useForm<{ channelName: string; public: string; private: string }>({
    mode: 'onSubmit',
  })

  const onSubmit = (values: CreateChannelFormValues) => {
    if (
      (values.public === 'false' && values.private === 'false') ||
      (values.public === 'true' && values.private === 'true')
    ) {
      setError('channelName', { message: 'Must select either public or private' })
    }
    logger.warn('submitting!', values)
    submitForm(createChannel, values)
  }

  const submitForm = (handleSubmit: (name: string, isPublic: boolean) => void, values: CreateChannelFormValues) => {
    handleSubmit(parseName(values.channelName), (values.public as any) === true || values.public === 'true')
  }

  const onNameChange = (name: string) => {
    setValue('channelName', name)
    const parsedName = parseName(name)
    setChannelName(parsedName)
    setParsedNameDiffers(name !== parsedName)
  }

  const onIsPublicChange = () => {
    const newValue = !isChannelPublic
    setValue('public', String(newValue))
    setValue('private', String(!newValue))
    setIsChannelPublic(newValue)
    setIsChannelPrivate(!newValue)
  }

  const onIsPrivateChange = () => {
    const newValue = !isChannelPrivate
    setValue('private', String(newValue))
    setValue('public', String(!newValue))
    setIsChannelPrivate(newValue)
    setIsChannelPublic(!newValue)
  }

  React.useEffect(() => {
    if (!open) {
      setValue('channelName', '')
      setChannelName('')
      setIsChannelPublic(false)
      setIsChannelPrivate(false)
      clearErrors()
      clearErrorsDispatch()
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container justifyContent='flex-start' direction='column' className={classes.fullContainer}>
            <Typography variant='h3' className={classes.title}>
              Create a new public channel
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
                  errors={errors}
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
              {!errors.channelName && channelName.length > 0 && parsedNameDiffers && (
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
            <Grid item>
              <Typography variant='h5' className={classes.subtitle}>
                Channel Access Control
              </Typography>
            </Grid>
            <Controller
              control={control}
              rules={createChannelFields.public.validation}
              name={'public'}
              render={({ field }) => (
                <Grid item container direction='column' className={classes.radioDiv}>
                  <Grid item className={classes.publicPrivate}>
                    <FormControlLabel
                      classes={{ root: classes.radioIcon }}
                      control={
                        <Checkbox
                          value={'public'}
                          icon={<Icon src={radioUnselected} />}
                          checkedIcon={<Icon src={radioChecked} />}
                          checked={isChannelPublic && !isChannelPrivate}
                        />
                      }
                      onChange={(event, checked) => {
                        event.persist()
                        onIsPublicChange()
                        field.onChange(event)
                      }}
                      label={
                        <Grid container direction='column' className={classes.offset}>
                          <Grid item>
                            <span className={classes.bold}>Public</span>
                          </Grid>
                          <Grid item>
                            <span>Channel is visible to all members of the community</span>
                          </Grid>
                        </Grid>
                      }
                    />
                  </Grid>
                </Grid>
              )}
            />
            <Controller
              control={control}
              rules={createChannelFields.private.validation}
              name={'private'}
              render={({ field }) => (
                <Grid item container direction='column' className={classes.radioDiv}>
                  <Grid item className={classes.publicPrivate}>
                    <FormControlLabel
                      classes={{ root: classes.radioIcon }}
                      control={
                        <Checkbox
                          value={'private'}
                          icon={<Icon src={radioUnselected} />}
                          checkedIcon={<Icon src={radioChecked} />}
                          checked={isChannelPrivate && !isChannelPublic}
                        />
                      }
                      onChange={(event, checked) => {
                        event.persist()
                        onIsPrivateChange()
                        field.onChange(event)
                      }}
                      label={
                        <Grid container direction='column' className={classes.offset}>
                          <Grid item>
                            <span className={classes.bold}>Private</span>
                          </Grid>
                          <Grid item>
                            <span>
                              Channel is visible only to community members that have been added to the channel
                            </span>
                          </Grid>
                        </Grid>
                      }
                    />
                  </Grid>
                </Grid>
              )}
            />
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
