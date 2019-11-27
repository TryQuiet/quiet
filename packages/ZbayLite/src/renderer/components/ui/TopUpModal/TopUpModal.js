import React from 'react'
import PropTypes from 'prop-types'

import { Grid } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'

import AddFunds from '../../../components/widgets/settings/AddFunds'
import Modal from '../Modal'

const styles = theme => ({
  root: {
    padding: theme.spacing(4)
  },
  title: {
    paddingBottom: theme.spacing(1)
  },
  select: {
    ...theme.typography.h5,
    padding: '0 24px 0 0'
  },
  selectWrapper: {
    margin: '0 8px',
    borderBottom: 'none'
  },
  shield: {
    marginTop: theme.spacing(2)
  },
  dataRoot: {
    padding: `0 ${theme.spacing(4)}px`
  },
  description: {
    marginBottom: theme.spacing(2)
  },
  copyField: {
    width: 370,
    borderRadius: 4,
    marginBottom: theme.spacing(2)
  },
  copyInput: {
    borderRight: `1px solid`,
    paddingTop: 18,
    paddingBottom: 18
  }
})

export const TopUpModal = ({
  classes,
  open,
  handleClose,
  ...rest
}) => (
  <Modal open={open} handleClose={handleClose}>
    <Grid container justify={'center'}>
      <Grid item xs>
        <AddFunds {...rest} variant={'wide'} />
      </Grid>
    </Grid>
  </Modal>
)

TopUpModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(['transparent', 'private']),
  address: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleCopy: PropTypes.func
}

TopUpModal.defaultProps = {
  open: false,
  handleCopy: () => null
}

export default withStyles(styles)(TopUpModal)
