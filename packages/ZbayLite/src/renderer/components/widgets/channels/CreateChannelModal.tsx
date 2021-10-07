import React from 'react'

import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'

import Modal from '../../ui/Modal/Modal'
import CreateChannelForm from '../../../containers/widgets/channels/CreateChannelForm'

const useStyles = makeStyles(() => ({
  root: {
    padding: 32,
    height: '100%',
    width: '100%'
  }
}))

interface CreateChannelModalProps {
  open: boolean
  handleClose: (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => void
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ open, handleClose }) => {
  const classes = useStyles({})
  return (
    <Modal
      open={open}
      handleClose={handleClose}
      title=''
      fullPage
    >
      <Grid className={classes.root}>
        <CreateChannelForm />
      </Grid>
    </Modal>
  )
}

export default CreateChannelModal
