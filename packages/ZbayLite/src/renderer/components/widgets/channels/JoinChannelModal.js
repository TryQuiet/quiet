import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Formik, Form } from 'formik'
import Immutable from 'immutable'
import { Typography } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'

import Modal from '../../ui/Modal'
import { AutocompleteField } from '../../ui/form/Autocomplete'
import { errorNotification } from '../../../store/handlers/utils'

const styles = theme => ({
  root: {
    padding: 32,
    height: '100%',
    width: '100%'
  },
  fullContainer: {
    width: '100%',
    height: '100%'
  },
  gutter: {
    marginBottom: theme.spacing(4)
  },
  button: {
    width: 165,
    backgroundColor: theme.palette.colors.zbayBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.zbayBlue
    }
  },
  title: {
    marginBottom: 24
  }
})
export const JoinChannelModal = ({
  classes,
  open,
  handleClose,
  joinChannel,
  joinChannelUrl,
  publicChannels,
  showNotification
}) => {
  const channelsArray = publicChannels.toList().toJS()
  return (
    <Modal open={open} handleClose={handleClose} title='' fullPage>
      <Grid className={classes.root}>
        <Formik
          onSubmit={(values, { resetForm }) => {
            if (values.channel.startsWith('#')) {
              const ch = publicChannels.find(
                channel => channel.name === values.channel.substring(1)
              )
              if (!ch) {
                showNotification(errorNotification({ message: `Channel does not exist` }))
                return
              }
              joinChannel(ch)
              handleClose()
              resetForm()
              return
            }
            if (values.channel.startsWith('https')) {
              joinChannelUrl(decodeURIComponent(values.channel))
              handleClose()
              resetForm()
              return
            }
            showNotification(
              errorNotification({ message: `There was an error. Please check channel URL` })
            )
          }}
        >
          {({ values, setFieldValue }) => (
            <Form className={classes.fullContainer}>
              <Grid
                container
                justify='flex-start'
                direction='column'
                className={classes.fullContainer}
              >
                <Typography variant='h3' className={classes.title}>
                  Join a Channel
                </Typography>
                <Typography variant='body2'>Channel Name or URL</Typography>
                <AutocompleteField
                  freeSolo
                  name={'channel'}
                  inputValue={values.channel || ''}
                  options={channelsArray.map(option => '#' + option.name)}
                  value={values.channel}
                  onChange={(e, v) => setFieldValue('channel', v)}
                  onInputChange={(e, v) => {
                    setFieldValue('channel', v)
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      className={classes.gutter}
                      variant='outlined'
                      multiline
                      maxRows={7}
                      placeholder={`[e.g. “#science” or “https://zbay.io/du3HSd…”]`}
                      margin='normal'
                      fullWidth
                    />
                  )}
                />
                <Button
                  className={classes.button}
                  variant='contained'
                  color='primary'
                  size='large'
                  type='submit'
                >
                  Join Channel
                </Button>
              </Grid>
            </Form>
          )}
        </Formik>
      </Grid>
    </Modal>
  )
}

JoinChannelModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  joinChannel: PropTypes.func.isRequired,
  joinChannelUrl: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  publicChannels: PropTypes.instanceOf(Immutable.Map).isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(JoinChannelModal)
