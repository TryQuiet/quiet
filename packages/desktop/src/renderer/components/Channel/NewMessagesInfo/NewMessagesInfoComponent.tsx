import { makeStyles, Typography } from '@material-ui/core'
import React from 'react'
import Icon from '../../ui/Icon/Icon'
import arrowDown from '../../../static/images/arrowDown.svg'

const useStyles = makeStyles(theme => ({
  wrapper: {
    width: '100%',
    position: 'absolute',
    bottom: 20,
    zIndex: 9
  },
  indicator: {
    margin: '0 auto',
    display: 'flex',
    backgroundColor: theme.palette.colors.purple,
    width: 200,
    height: 40,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer'
  },
  label: {
    color: theme.palette.colors.white,
    fontSize: '0.855rem',
    whiteSpace: 'pre-line',
    lineHeight: '21px'
  },
  icon: {
    width: 16,
    height: 16,
    margin: '0px 0px 0px 8px'
  }
}))

export interface NewMessagesInfoComponentProps {
  scrollBottom: () => void
  show: boolean
}

export const NewMessagesInfoComponent: React.FC<NewMessagesInfoComponentProps> = ({
  scrollBottom,
  show
}) => {
  const classes = useStyles({})
  return (
    <div className={classes.wrapper}>
      <div className={classes.indicator} style={{ visibility: show ? 'visible' : 'hidden' }} onClick={scrollBottom}>
        <Typography className={classes.label}>New messages</Typography>
        <Icon src={arrowDown} className={classes.icon} />
      </div>
    </div>
  )
}
