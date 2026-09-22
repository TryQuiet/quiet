import React from 'react'
import { styled } from '@mui/material/styles'
import { Typography } from '@mui/material'
import Icon from '../../ui/Icon/Icon'
import arrowDown from '../../../static/images/arrowDown.svg'

const PREFIX = 'NewMessagesInfoComponent'

const classes = {
  wrapper: `${PREFIX}wrapper`,
  indicator: `${PREFIX}indicator`,
  label: `${PREFIX}label`,
  icon: `${PREFIX}icon`,
}

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.wrapper}`]: {
    width: '100%',
    position: 'absolute',
    bottom: 20,
    zIndex: 2,
  },

  [`& .${classes.indicator}`]: {
    margin: '0 auto',
    display: 'flex',
    // 'alert-new-messages' (library 1058:618): 32 tall, radius 8, primary purple, caption 12/16 in white.
    backgroundColor: theme.palette.colors.purple,
    width: 200,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },

  [`& .${classes.label}`]: {
    color: theme.palette.colors.white,
    fontSize: theme.typography.caption.fontSize,
    whiteSpace: 'pre-line',
    lineHeight: theme.typography.caption.lineHeight,
  },

  [`& .${classes.icon}`]: {
    width: 16,
    height: 16,
    marginLeft: theme.space.sm,
  },
}))

export interface NewMessagesInfoComponentProps {
  scrollBottom: () => void
  show: boolean
}

export const NewMessagesInfoComponent: React.FC<NewMessagesInfoComponentProps> = ({ scrollBottom, show }) => {
  return (
    <Root className={classes.wrapper} style={{ display: show ? 'block' : 'none' }}>
      <div className={classes.indicator} onClick={scrollBottom}>
        <Typography className={classes.label}>New messages</Typography>
        <Icon src={arrowDown} className={classes.icon} />
      </div>
    </Root>
  )
}

export default NewMessagesInfoComponent
