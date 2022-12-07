import React from 'react'

import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import Icon from '../../ui/Icon/Icon'
import usernameIcon from '../../../static/images/username.svg'

const PREFIX = 'UsernameCreated'

const classes = {
  root: `${PREFIX}root`,
  usernameConatainer: `${PREFIX}usernameConatainer`,
  infoConatainer: `${PREFIX}infoConatainer`,
  descConatainer: `${PREFIX}descConatainer`,
  usernameIcon: `${PREFIX}usernameIcon`,
  buttonContainer: `${PREFIX}buttonContainer`,
  button: `${PREFIX}button`
}

const StyledGrid = styled(Grid)((
  {
    theme
  }
) => ({
  [`& .${classes.root}`]: {},

  [`& .${classes.usernameConatainer}`]: {
    marginTop: 24
  },

  [`& .${classes.infoConatainer}`]: {
    marginTop: 24
  },

  [`& .${classes.descConatainer}`]: {
    marginTop: 8
  },

  [`& .${classes.usernameIcon}`]: {
    width: 118,
    height: 118,
    justifyContent: 'center'
  },

  [`& .${classes.buttonContainer}`]: {
    marginTop: 23,
    paddingBottom: 63
  },

  [`& .${classes.button}`]: {
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
  setFormSent(false)
  return (
    <StyledGrid container justifyContent='center'>
      <Grid
        container
        className={classes.usernameConatainer}
        item
        xs={12}
        direction='row'
        justifyContent='center'
      >
        <Icon className={classes.usernameIcon} src={usernameIcon} />
      </Grid>
      <Grid
        container
        item
        className={classes.infoConatainer}
        xs={12}
        direction='row'
        justifyContent='center'
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
    </StyledGrid>
  )
}

export default UsernameCreated
