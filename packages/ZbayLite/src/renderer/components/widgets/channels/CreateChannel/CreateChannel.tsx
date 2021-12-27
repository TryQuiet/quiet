import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Grid, Typography, LinearProgress } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

import WarningIcon from '@material-ui/icons/Warning'

import Modal from '../../../ui/Modal/Modal'
import LoadingButton from '../../../ui/LoadingButton/LoadingButton'

import { TextInput } from '../../../../forms/components/textInput'
import { channelNameField } from '../../../../forms/fields/createChannelFields'

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
    backgroundColor: theme.palette.colors.zbayBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.zbayBlue
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

export const parseChannelName = (name = '') => {
  return name.toLowerCase().replace(/ +/g, '-')
}

interface CreateChannelFormValues {
  name: string
}

export interface CreateChannelProps {
  open: boolean
  createChannel: (name: string) => void
  handleClose: () => void
}

export const CreateChannelComponent: React.FC<CreateChannelProps> = ({
  open,
  createChannel,
  handleClose
}) => {
  const classes = useStyles({})

  const [formSent, setFormSent] = useState(false)
  const [channelName, setChannelName] = useState('')

  const {
    handleSubmit,
    formState: { errors },
    control
  } = useForm<{ channelName: string }>({
    mode: 'onTouched'
  })

  const onSubmit = (values: CreateChannelFormValues) =>
    submitForm(createChannel, values, setFormSent)

  const submitForm = (
    handleSubmit: (value: string) => void,
    values: CreateChannelFormValues,
    setFormSent
  ) => {
    setFormSent(true)
    handleSubmit(parseChannelName(values.name))
  }

  return (
    <Modal open={open} handleClose={handleClose}>
      <Grid container className={classes.main} direction='column'>
        <>
          {!formSent && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid
                container
                justify='flex-start'
                direction='column'
                className={classes.fullContainer}>
                <Typography variant='h3' className={classes.title}>
                  Create a new public channel
                </Typography>
                <Typography variant='body2'>Channel name</Typography>
                <Controller
                  control={control}
                  rules={channelNameField().validation}
                  name={'channelName'}
                  render={({ field }) => (
                    <TextInput
                      {...channelNameField().fieldProps}
                      fullWidth
                      classes={''}
                      variant='outlined'
                      name='name'
                      placeholder={'Enter a channel name'}
                      errors={errors}
                      onchange={e => {
                        setChannelName(parseChannelName(e.target.value))
                        field.onChange()
                      }}
                      onblur={field.onBlur}
                      value={field.value}
                    />
                  )}
                />
                <div className={classes.gutter}>
                  {channelName.length > 0 && (
                    <Grid container alignItems='center' direction='row'>
                      <Grid item className={classes.iconDiv}>
                        <WarningIcon className={classes.warrningIcon} />
                      </Grid>
                      <Grid item xs>
                        <Typography variant='body2' className={classes.warrningMessage}>
                          Your channel will be created as <b>{`#${channelName}`}</b>
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
                />
              </Grid>
            </form>
          )}
          {formSent && (
            <Grid container alignItems='center' justify='center'>
              <Grid item>
                <Typography variant='h3'>Creating Channel</Typography>
              </Grid>
              <Grid item container justify='center' alignItems='center'>
                <LinearProgress
                  classes={{
                    root: classes.rootBar,
                    barColorPrimary: classes.progressBar
                  }}
                />
              </Grid>
              <Grid item>
                <Typography variant='body1' className={classes.info}>
                  Generating keys
                </Typography>
              </Grid>
            </Grid>
          )}
        </>
      </Grid>
    </Modal>
  )
}

export default CreateChannelComponent
