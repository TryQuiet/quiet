import React from 'react'
import { Formik, Form } from 'formik'
import * as Yup from 'yup'

import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import WarningIcon from '@material-ui/icons/Warning'
import { Typography } from '@material-ui/core'

import TextField from '../../ui/TextField/TextField'
import LoadingButton from '../../ui/LoadingButton/LoadingButton'

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

export const parseChannelName = (name = '') => {
  return name.toLowerCase().replace(/ +/g, '-')
}
export const formSchema = Yup.object().shape({
  name: Yup.string()
    .max(20, 'Channel name is too long.')
    .test(
      'testFormat',
      'Channel name can contain only small characters and up to one hyphen.',
      function (value) {
        return parseChannelName(value).match(/^[a-z0-9]+([\s-][a-z0-9]+){0,}$/)
      }
    )
    .required('Your channel must have a name.')
})

export const formDisabledSchema = Yup.object().shape({
  name: Yup.string()
    .test(
      'testFormat',
      'Creating new channels has been temporarily disabled while we transition to a faster approach to group messaging. Apologies for the inconvenience!',
      function () {
        return false
      }
    )
    .required('Creating new channels has been temporarily disabled')
})

export const showParsedMessage = (message = '') => {
  return message.includes(' ') || message !== message.toLowerCase()
}

interface CreateChannelFormProps {
  onSubmit: ({ name }, formActions, setStep) => void
  setStep: () => void
}

export const CreateChannelForm: React.FC<CreateChannelFormProps> = ({ onSubmit, setStep }) => {
  const classes = useStyles({})
  return (
    <Formik
      validationSchema={formDisabledSchema}
      onSubmit={(values, formActions) => {
        onSubmit(
          { ...values, name: parseChannelName(values.name) },
          formActions,
          setStep
        )
      }}
      initialValues={{ name: '' }}
    >
      {({ isSubmitting, values, isValid }) => (
        <Form className={classes.fullContainer}>
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
            <TextField name='name' />
            <div className={classes.gutter}>
              {showParsedMessage(values.name) && isValid && (
                <Grid container alignItems='center' direction='row'>
                  <Grid item className={classes.iconDiv}>
                    <WarningIcon className={classes.warrningIcon} />
                  </Grid>
                  <Grid item xs className=''>
                    <Typography
                      variant='body2'
                      className={classes.warrningMessage}
                    >
                      Your channel will be created as{' '}
                      {parseChannelName(values.name)}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </div>
            <LoadingButton
              variant='contained'
              color='primary'
              disabled={true} // Temporarily turn off
              inProgress={isSubmitting}
              type='submit'
              text='Create Channel'
              classes={{ button: classes.button }}
            />
          </Grid>
        </Form>
      )}
    </Formik>
  )
}

export default CreateChannelForm
