import React from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Grid, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

import Modal from '../../ui/Modal/Modal'
import LoadingButton from '../../ui/LoadingButton/LoadingButton'

import { TextInput } from '../../../forms/components/textInput'
import { channelNameField } from '../../../forms/fields/createChannelFields'
import { parseName } from '../../../../utils/functions/naming'

const useStyles = makeStyles(theme => ({
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

const createChannelFields = {
  channelName: channelNameField()
}

interface CreateChannelFormValues {
  channelName: string
}

export interface CreateChannelProps {
  open: boolean
  channelCreationError?: string
  createChannel: (name: string) => void
  handleClose: () => void
}

export const CreateChannelComponent: React.FC<CreateChannelProps> = ({
  open,
  channelCreationError,
  createChannel,
  handleClose
}) => {
  const classes = useStyles({})

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    control
  } = useForm<{ channelName: string }>({
    mode: 'onTouched'
  })

  const onSubmit = (values: CreateChannelFormValues) => {
    submitForm(createChannel, values)
  }

  const submitForm = (handleSubmit: (value: string) => void, values: CreateChannelFormValues) => {
    handleSubmit(parseName(values.channelName, true))
  }

  React.useEffect(() => {
    if (!open) {
      setValue('channelName', '')
    }
  }, [open])

  React.useEffect(() => {
    if (channelCreationError) {
      setError('channelName', { message: channelCreationError })
    }
  }, [channelCreationError])

  return (
    <Modal open={open} handleClose={handleClose} data-testid={'createChannelModal'}>
      <Grid container className={classes.main} direction='column'>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container justify='flex-start' direction='column' className={classes.fullContainer}>
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
                <TextInput
                  {...createChannelFields.channelName.fieldProps}
                  fullWidth
                  classes={''}
                  variant='outlined'
                  placeholder={'Enter a channel name'}
                  errors={errors}
                  onchange={event => {
                    field.onChange(event)
                  }}
                  onblur={() => {
                    field.onBlur()
                  }}
                  value={parseName(field.value)}
                  data-testid={'createChannelInput'}
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
            />
          </Grid>
        </form>
      </Grid>
    </Modal>
  )
}

export default CreateChannelComponent
