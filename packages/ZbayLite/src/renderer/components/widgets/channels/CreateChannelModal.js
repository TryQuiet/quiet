import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Grid from '@material-ui/core/Grid'
import { withStyles } from '@material-ui/core/styles'

import Modal from '../../ui/Modal'
import CreateChannelForm from '../../../containers/widgets/channels/CreateChannelForm.js'

const styles = theme => ({
  root: {
    padding: 32,
    height: '100%',
    width: '100%'
  }
})

export const CreateChannelModal = ({ classes, open, handleClose }) => (
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

CreateChannelModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(CreateChannelModal)
