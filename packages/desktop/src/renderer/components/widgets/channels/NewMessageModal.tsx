import React from 'react'
import { styled } from '@mui/material/styles';
import { Formik, Form } from 'formik'
import { Typography } from '@mui/material'
import Grid from '@mui/material/Grid'
import { makeStyles } from '@mui/material/styles'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

import { TextField as FormikTextField } from '../../ui/TextField/TextField'
import Modal from '../../ui/Modal/Modal'
import { AutocompleteField } from '../../ui/Autocomplete/Autocomplete'

import { User } from '@quiet/state-manager'

import { Dictionary } from '@reduxjs/toolkit'

const PREFIX = 'NewMessageModal';

const classes = {
  root: `${PREFIX}-root`,
  fullContainer: `${PREFIX}-fullContainer`,
  gutter: `${PREFIX}-gutter`,
  button: `${PREFIX}-button`,
  title: `${PREFIX}-title`
};

const StyledModal = styled(Modal)((
  {
    theme
  }
) => ({
  [`& .${classes.root}`]: {
    padding: 32,
    height: '100%',
    width: '100%'
  },

  [`& .${classes.fullContainer}`]: {
    width: '100%',
    height: '100%'
  },

  [`& .${classes.gutter}`]: {
    marginBottom: theme.spacing(4),
    marginTop: 0
  },

  [`& .${classes.button}`]: {
    marginTop: 24,
    width: 165,
    backgroundColor: theme.palette.colors.quietBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue
    }
  },

  [`& .${classes.title}`]: {
    marginBottom: 24
  }
}));

interface NewMessageModalProps {
  open: boolean
  handleClose: () => void
  sendMessage: (payload) => void
  users: Dictionary<User>
}

export const NewMessageModal: React.FC<NewMessageModalProps> = ({
  open,
  handleClose,
  sendMessage,
  users
}) => {

  const usersArray = Array.from(Object.values(users))
  return (
    <StyledModal open={open} handleClose={handleClose} title='' fullPage>
      <Grid className={classes.root}>
        <Formik
          initialValues={{
            recipient: '',
            message: '',
            user: {}
          }}
          onSubmit={(values, { resetForm }) => {
            const isAddressValid = /^t1[a-zA-Z0-9]{33}$|^ztestsapling1[a-z0-9]{75}$|^zs1[a-z0-9]{75}$/.test(
              values.recipient
            )
            const targetUser = usersArray.find(user => user.username === values.recipient)
            let payload
            if (targetUser) {
              payload = {
                message: values.message || '',
                spent: 0.0,
                receiver: {
                  username: targetUser.username
                }
              }
              sendMessage(payload)
              handleClose()
              resetForm()
              return
            }
            if (isAddressValid) {
              payload = {
                message: values.message || '',
                spent: 0.0,
                receiver: {
                  replyTo: values.recipient,
                  username: values.recipient.substring(0, 15)
                }
              }
              sendMessage(payload)
              handleClose()
              resetForm()
            }
          }}>
          {({ values, setFieldValue }) => (
            <Form className={classes.fullContainer}>
              <Grid
                container
                justifyContent='flex-start'
                direction='column'
                className={classes.fullContainer}>
                <Typography variant='h3' className={classes.title}>
                  New message
                </Typography>
                <Typography variant='body2'>Recipient</Typography>
                <AutocompleteField
                  freeSolo
                  name={'recipient'}
                  inputValue={values.recipient || ''}
                  options={usersArray.map(option => option.username)}
                  value={values.recipient}
                  onChange={(_e: React.SyntheticEvent, v: string) => setFieldValue('recipient', v)}
                  onInputChange={(_e: React.ChangeEvent, v: string) => {
                    setFieldValue('recipient', v)
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      className={classes.gutter}
                      variant='outlined'
                      multiline
                      rowsMax={7}
                      placeholder={'Enter Quiet username'}
                      margin='normal'
                      fullWidth
                    />
                  )}
                />
                <Typography variant='body2'>Message text</Typography>
                <FormikTextField
                  name='message'
                  placeholder={'Enter message (optional)'}
                  InputProps={{}}
                  disabled={false}
                />
                <Button
                  className={classes.button}
                  variant='contained'
                  color='primary'
                  size='large'
                  type='submit'>
                  Send message
                </Button>
              </Grid>
            </Form>
          )}
        </Formik>
      </Grid>
    </StyledModal>
  );
}

export default NewMessageModal
