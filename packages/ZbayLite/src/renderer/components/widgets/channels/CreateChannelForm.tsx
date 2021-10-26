import React from 'react'

import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'

import LoadingButton from '../../ui/LoadingButton/LoadingButton'
import { TextInput } from '../../../forms/components/textInput'
import { Controller, useForm } from 'react-hook-form'
import { channelNameField } from '../../../forms/fields/createChannelFields'

const useStyles = makeStyles((theme) => ({
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
  warrningIcon: {
    color: '#FFCC00'
  },
  iconDiv: {
    width: 24,
    height: 28,
    marginRight: 8
  },
  warrningMessage: {
    wordBreak: 'break-word'
  }
}))

export const showParsedMessage = (message = '') => {
  return message.includes(' ') || message !== message.toLowerCase()
}

interface CreateChannelFormProps {
  // onSubmit: ({ name }: { name: string }, formActions, setStep) => void
  setStep: (arg: number) => void
}

interface CreateChannelValues {
  channelName: string
}

const channelFields = {
  channelName: channelNameField()
}

export const CreateChannelForm: React.FC<CreateChannelFormProps> = ({ setStep }) => {
  const classes = useStyles({})

  const { handleSubmit, formState: { errors }, control } = useForm<CreateChannelValues>({
    mode: 'onTouched'
  })

  const onSubmit = () => {
    // (values, formActions) => {
    //   onSubmit(
    //     { ...values, name: parseChannelName(values.name) },
    //     formActions,
    //     setStep
    //   )
    // }
    setStep(1)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
    >
      <Grid
        container
        justify='flex-start'
        direction='column'
        className={classes.fullContainer}
      >
        <Typography variant='h3' className={classes.title}>
          Create a new private channel (temporarily disabled)
        </Typography>
        <Typography variant='body2'>Channel name</Typography>
        <Controller
          control={control}
          defaultValue={''}
          rules={channelFields.channelName.validation}
          name={'channelName'}
          render={({ field }) => (
            <TextInput
              name='name'
              defaultValue={''}
              variant='outlined'
              errors={errors}
              classes={''}
              {...channelFields.channelName.fieldProps}
              fullWidth
              onchange={field.onChange}
              onblur={field.onBlur}
              value={field.value}
              placeholder={'Enter a channel name'}
            />
          )}
        />
        <div className={classes.gutter}>
          {/* {true && ( // disabled for now
            <Grid container alignItems='center' direction='row'>
              <Grid item className={classes.iconDiv}>
                <WarningIcon className={classes.warrningIcon} />
              </Grid>
              <Grid item xs className=''>
                <Typography
                  variant='body2'
                  className={classes.warrningMessage}
                >
                  Your channel will be created as{` ${}`}

                </Typography>
              </Grid>
            </Grid>
          )} */}
        </div>
        <LoadingButton
          variant='contained'
          color='primary'
          disabled={false} // Temporarily turn off
          inProgress={false}
          type='submit'
          text='Create Channel'
          classes={{ button: classes.button }}
        />
      </Grid>
    </form>
  )
}

export default CreateChannelForm
