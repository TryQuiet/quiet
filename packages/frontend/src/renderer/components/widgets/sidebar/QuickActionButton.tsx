import React, { ReactElement } from 'react'

import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'

const useStyles = makeStyles((theme) => ({
  button: {
    marginTop: 8,
    padding: 0,
    marginLeft: 16,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'inherit',
      opacity: 1
    },
    opacity: 0.7,
    color: theme.palette.colors.white
  },
  icon: {
    fontSize: 12,
    marginRight: 2,
    marginLeft: -2,
    marginBottom: 2
  },
  iconDiv: {
    marginRight: 5,
    marginBottom: 2
  }
}))

interface QuickActionButtonProps {
  text: string
  action: () => void
  icon?: ReactElement<any, any>
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({ text, action, icon }) => {
  const classes = useStyles({})
  return (
    <Button variant='text' className={classes.button} onClick={action}>
      {icon ? (
        <div className={classes.iconDiv}>{icon}</div>
      ) : (
        <AddIcon className={classes.icon} />
      )}
      <Typography variant='body2'>{text}</Typography>
    </Button>
  )
}

export default QuickActionButton
