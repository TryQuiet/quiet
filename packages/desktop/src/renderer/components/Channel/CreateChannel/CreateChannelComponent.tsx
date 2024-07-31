import React, { useEffect } from 'react'
import { styled } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'

import { Grid, Typography } from '@mui/material'

import Modal from '../../ui/Modal/Modal'
import LoadingButton from '../../ui/LoadingButton/LoadingButton'

import { TextField } from '../../ui/TextField/TextField'
import { channelNameField } from '../../../forms/fields/createChannelFields'

const PREFIX = 'CreateChannelComponent'

const classes = {
  fullContainer: `${PREFIX}fullContainer`,
  gutter: `${PREFIX}gutter`,
  button: `${PREFIX}button`,
  title: `${PREFIX}title`,
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
}))

const createChannelFields = {
  channelName: channelNameField(),
}

interface CreateChannelFormValues {
  channelName: string
}

export interface CreateChannelProps {
  open: boolean
  channelCreationError?: string
  createChannel: (name: string) => void
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
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
    control,
  } = useForm<{ channelName: string }>({
    mode: 'onSubmit',
  })

  const onSubmit = (values: CreateChannelFormValues) => {
    submitForm(createChannel, values)
  }

  const submitForm = (handleSubmit: (value: string) => void, values: CreateChannelFormValues) => {
    handleSubmit(values.channelName)
  }

  const onChange = (name: string) => {
    setValue('channelName', name)
  }

  useEffect(() => {
    if (!open) {
      setValue('channelName', '')
      clearErrors()
      clearErrorsDispatch()
    }
  }, [open])

  useEffect(() => {
    if (channelCreationError) {
      setError('channelName', { message: channelCreationError })
    }
  }, [channelCreationError])

  return (
    <Modal open={open} handleClose={handleClose} data-testid='createChannelModal'>
      <StyledModalContent container direction='column'>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container justifyContent='flex-start' direction='column' className={classes.fullContainer}>
            <Typography variant='h3' className={classes.title}>
              Create a new public channel
            </Typography>
            <Typography variant='body2'>Channel name</Typography>
            <Controller
              control={control}
              defaultValue=''
              rules={createChannelFields.channelName.validation}
              name='channelName'
              render={({ field }) => (
                <TextField
                  {...createChannelFields.channelName.fieldProps}
                  fullWidth
                  classes=''
                  variant='outlined'
                  placeholder='Enter a channel name'
                  autoFocus
                  errors={errors}
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
                  data-testid='createChannelInput'
                />
              )}
            />
            <div className={classes.gutter} />
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
