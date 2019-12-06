import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { withStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'

import QuickActionLayout from './QuickActionLayout'
import icon from './assets/addFundsIcon.png'

const Icon = ({ className }) => <img className={className} src={icon} />

const styles = theme => ({})
export const DepositMoneyModal = ({ classes, handleClose, open, onClick }) => (
  <Dialog onClose={handleClose} className={classes.root} open={open}>
    <QuickActionLayout
      main='Add funds now?'
      info={`You'll need some funds to send messages.`}
      handleClose={handleClose}
      buttonName='Add funds'
      onClick={onClick}
    >
      <Icon />
    </QuickActionLayout>
  </Dialog>
)

DepositMoneyModal.propTypes = {
  classes: PropTypes.object.isRequired,
  handleClose: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(DepositMoneyModal)
