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

import { TextField as FormikTextField } from '../../ui/form/TextField'
import Modal from '../../ui/Modal'
import { AutocompleteField } from '../../ui/form/Autocomplete'
import { errorNotification, successNotification } from '../../../store/handlers/utils'
import { messageType } from '../../../../shared/static'

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
    marginBottom: theme.spacing(4),
    marginTop: 0
  },
  button: {
    marginTop: 24,
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
export const NewMessageModal = ({
  classes,
  open,
  handleClose,
  sendMessage,
  users,
  showNotification
}) => {
  const usersArray = users.toList().toJS()
  return (
    <Modal open={open} handleClose={handleClose} title='' fullPage>
      <Grid className={classes.root}>
        <Formik
          onSubmit={(values, { resetForm }) => {
            const isAddressValid = /^t1[a-zA-Z0-9]{33}$|^ztestsapling1[a-z0-9]{75}$|^zs1[a-z0-9]{75}$/.test(
              values.recipient
            )
            const targetUser = usersArray.find(
              user => user.nickname === values.recipient || user.address === values.recipient
            )
            let payload
            if (targetUser) {
              payload = {
                message: values.message || '',
                spent: 0.0,
                type: messageType.BASIC,
                receiver: {
                  replyTo: targetUser.address,
                  username: targetUser.nickname
                }
              }
              sendMessage(payload)
              handleClose()
              resetForm()
              showNotification(
                successNotification({
                  message: `Message sent! It will appear momentarily.`
                })
              )
              return
            }
            if (isAddressValid) {
              payload = {
                message: values.message || '',
                spent: 0.0,
                type: messageType.BASIC,
                receiver: {
                  replyTo: values.recipient,
                  username: values.recipient.substring(0, 15)
                }
              }
              sendMessage(payload)
              handleClose()
              resetForm()
              showNotification(
                successNotification({
                  message: `Message sent! It will appear momentarily.`
                })
              )
              return
            }
            showNotification(
              errorNotification({ message: `There was an error. Please check input address.` })
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
                  New message
                </Typography>
                <Typography variant='body2'>Recipient</Typography>
                <AutocompleteField
                  freeSolo
                  name={'recipient'}
                  inputValue={values.recipient || ''}
                  options={usersArray.map(option => option.nickname)}
                  value={values.recipient}
                  onChange={(e, v) => setFieldValue('recipient', v)}
                  onInputChange={(e, v) => {
                    setFieldValue('recipient', v)
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      className={classes.gutter}
                      variant='outlined'
                      multiline
                      maxRows={7}
                      placeholder={`Enter Zcash address or Zbay username`}
                      margin='normal'
                      fullWidth
                    />
                  )}
                />
                <Typography variant='body2'>Message text</Typography>
                <FormikTextField
                  name='message'
                  variant='outlined'
                  placeholder={'Enter message (optional)'}
                  InputProps={{ className: classes.field }}
                />
                <Button
                  className={classes.button}
                  variant='contained'
                  color='primary'
                  size='large'
                  type='submit'
                >
                  Send message
                </Button>
              </Grid>
            </Form>
          )}
        </Formik>
      </Grid>
    </Modal>
  )
}

NewMessageModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  sendMessage: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  users: PropTypes.instanceOf(Immutable.Map).isRequired
}
export default R.compose(
  React.memo,
  withStyles(styles)
)(NewMessageModal)
