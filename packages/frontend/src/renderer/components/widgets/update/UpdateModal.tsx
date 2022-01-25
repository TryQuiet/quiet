import React from 'react'

import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'

import Icon from '../../ui/Icon/Icon'
import updateIcon from '../../../static/images/updateIcon.svg'
import Modal from '../../ui/Modal/Modal'

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.colors.white,
    border: 'none'
  },
  info: {
    marginTop: 38
  },
  button: {
    height: 55,
    fontSize: '0.9rem',
    backgroundColor: theme.palette.colors.zbayBlue
  },
  updateIcon: {
    width: 102,
    height: 102
  },
  title: {
    marginTop: 24,
    marginBottom: 16
  },
  subTitle: {
    marginBottom: 32
  }
}))

interface UpdateModalProps {
  open: boolean
  handleClose: () => void
  handleUpdate: () => void
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ open, handleClose, handleUpdate }) => {
  const classes = useStyles({})
  return (
    <Modal open={open} handleClose={handleClose}>
      <Grid container direction='column' className={classes.root} alignItems='center' justify='flex-start'>
        <Grid className={classes.info} container justify='center'>
          <Grid item>
            <Icon src={updateIcon} />
          </Grid>
        </Grid>
        <Grid container item justify='center'>
          <Grid item className={classes.title}>
            <Typography variant='h3'>Softare update</Typography>
          </Grid>
        </Grid>
        <Grid container item justify='center'>
          <Grid item className={classes.subTitle}>
            <Typography variant='body2'>An update is available for Zbay.</Typography>
          </Grid>
        </Grid>
        <Grid container spacing={8} justify='center'>
          <Grid item xs={4}>
            <Button
              variant='contained'
              size='large'
              color='primary'
              type='submit'
              onClick={handleUpdate}
              fullWidth
              className={classes.button}
            >
              Update now
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Modal>
  )
}

export default UpdateModal
