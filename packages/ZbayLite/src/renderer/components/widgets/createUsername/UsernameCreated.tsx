import React from 'react'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'

import Icon from '../../ui/Icon/Icon'
import usernameIcon from '../../../static/images/username.svg'

const useStyles = makeStyles((theme) => ({
  root: {},
  usernameConatainer: {
    marginTop: 24
  },
  infoConatainer: {
    marginTop: 24
  },
  descConatainer: {
    marginTop: 8
  },
  usernameIcon: {
    width: 118,
    height: 118,
    justifyContent: 'center'
  },
  buttonContainer: {
    marginTop: 23,
    paddingBottom: 63
  },
  button: {
    width: 124,
    height: 59,
    color: theme.palette.colors.white,
    backgroundColor: theme.palette.colors.purple,
    padding: theme.spacing(2),
    '&:hover': {
      backgroundColor: theme.palette.colors.darkPurple
    },
    '&:disabled': {
      backgroundColor: theme.palette.colors.gray
    }
  }
}))

const handleModalClose = (handleClose, setFormSent) => {
  setFormSent(false)
  handleClose()
}

interface UsernameCreatedProps {
  handleClose: () => void
  setFormSent: (arg: boolean) => void
}

export const UsernameCreated: React.FC<UsernameCreatedProps> = ({ handleClose, setFormSent }) => {
  const classes = useStyles({})
  setFormSent(false)
  return (
    <Grid container justify={'center'}>
      <Grid
        container
        className={classes.usernameConatainer}
        item
        xs={12}
        direction='row'
        justify='center'
      >
        <Icon className={classes.usernameIcon} src={usernameIcon} />
      </Grid>
      <Grid
        container
        item
        className={classes.infoConatainer}
        xs={12}
        direction='row'
        justify='center'
      >
        <Typography variant={'h4'}>You created a username</Typography>
      </Grid>
      <Grid item xs={'auto'} className={classes.buttonContainer}>
        <Button
          variant='contained'
          onClick={() => handleModalClose(handleClose, setFormSent)}
          size='small'
          fullWidth
          className={classes.button}
        >
          Done
        </Button>
      </Grid>
    </Grid>
  )
}

export default UsernameCreated
