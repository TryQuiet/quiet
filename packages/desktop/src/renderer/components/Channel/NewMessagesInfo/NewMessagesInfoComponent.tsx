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
  icon: `${PREFIX}icon`
}

const Root = styled('div')((
  {
    theme
  }
) => ({
  [`&.${classes.wrapper}`]: {
    width: '100%',
    position: 'absolute',
    bottom: 20,
    zIndex: 2
  },

  [`& .${classes.indicator}`]: {
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

  [`& .${classes.label}`]: {
    color: theme.palette.colors.white,
    fontSize: '0.855rem',
    whiteSpace: 'pre-line',
    lineHeight: '21px'
  },

  [`& .${classes.icon}`]: {
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
