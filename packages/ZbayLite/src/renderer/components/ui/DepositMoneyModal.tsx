import React from 'react'

import { makeStyles } from '@material-ui/core/styles'

import { Dialog } from '@material-ui/core'
import QuickActionLayout from './QuickActionLayout'

import icon from './assets/addFundsIcon.png'

const Icon = className => <img className={className} src={icon} />

const useStyles = makeStyles(() => ({
  root: {}
}))

interface DepositMoneyProps {
  open: boolean
  onClick: () => void
  handleClose: () => void
}

export const DepositMoneyModal: React.FC<DepositMoneyProps> = ({ handleClose, open, onClick }) => {
  const classes = useStyles({})

  return (
    <Dialog onClose={handleClose} className={classes.root} open={open}>
      <QuickActionLayout
        main={'Add funds now?'}
        info={"You'll need some funds to send messages."}
        buttonName={'Add funds'}
        onClick={onClick}
        handleClose={handleClose}>
        <Icon />
      </QuickActionLayout>
    </Dialog>
  )
}

export default DepositMoneyModal
