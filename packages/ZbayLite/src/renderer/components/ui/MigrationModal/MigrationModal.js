import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import { shell } from 'electron'

import red from '@material-ui/core/colors/red'

import Icon from '../Icon/Icon'
import exclamationMark from '../../../static/images/exclamationMark.svg'
import Modal from '../Modal/Modal'
import LoadingButton from '../LoadingButton/LoadingButton'
import electronStore from '../../../../shared/electronStore'

const styles = theme => ({
  root: {
    padding: theme.spacing(4)
  },
  icon: {
    fontSize: '10rem',
    color: red[500],
    width: 80,
    height: 70
  },
  message: {
    wordBreak: 'break-all',
    marginTop: 20,
    fontWeight: 'bold'
  },
  info: {
    textAlign: 'center',
    fontSize: 15
  },

  button: {
    textTransform: 'none',
    width: 200,
    height: 60,
    backgroundColor: '#F25278'
  },
  link: {
    color: theme.palette.colors.linkBlue,
    cursor: 'pointer',
    textDecoration: 'underline'
  }
})

export const MigrationModal = ({ classes, open, handleClose }) => {
  return (
    <Modal open={open} handleClose={handleClose} title='' isCloseDisabled>
      <Grid
        container
        justify='flex-start'
        spacing={3}
        direction='column'
        className={classes.root}
      >
        <Grid item container direction='column' alignItems='center'>
          <Icon className={classes.icon} src={exclamationMark} />
          <Typography variant='h3' className={classes.message}>
            An important note...
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant='body2' className={classes.info}>
            Any "transparent" Zcash addresses from before this update are no
            longer working. Only use new addresses.{' '}
            <span
              className={classes.link}
              onClick={e => {
                e.preventDefault()
                shell.openExternal('https://github.com/ZbayApp/zbay#removing-data')
              }}
            >
              Learn more
            </span>
          </Typography>
        </Grid>

        <Grid item container justify='center' alignItems='center'>
          <LoadingButton
            classes={{ button: classes.button }}
            text='I understand'
            onClick={() => {
              electronStore.set('isMigrating', false)
              handleClose()
            }}
          />
        </Grid>
      </Grid>
    </Modal>
  )
}

MigrationModal.propTypes = {
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
}

MigrationModal.defaultProps = {
  open: false
}

export default R.compose(React.memo, withStyles(styles))(MigrationModal)
