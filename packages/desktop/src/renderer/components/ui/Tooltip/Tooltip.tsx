import React, { ReactElement, ReactFragment } from 'react'
import { styled } from '@mui/material/styles';
import classNames from 'classnames'

import MuiTooltip from '@mui/material/Tooltip'
import { makeStyles } from '@mui/material/styles'

const PREFIX = 'Tooltip';

const classes = {
  noWrap: `${PREFIX}-noWrap`,
  tooltip: `${PREFIX}-tooltip`,
  text: `${PREFIX}-text`,
  arrow: `${PREFIX}-arrow`
};

const Root = styled('span')((
  {
    theme
  }
) => ({
  [`& .${classes.noWrap}`]: {
    maxWidth: 'none',
    filter: 'drop-shadow(0 0 0px #aaaaaa)'
  },

  [`& .${classes.tooltip}`]: {
    marginBottom: 5,
    background: theme.palette.colors.trueBlack,
    color: theme.typography.body1.color,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 8
  },

  [`& .${classes.text}`]: {
    color: theme.palette.colors.white,
    fontSize: 12,
    fontWeight: 500
  },

  [`& .${classes.arrow}`]: {
    '&:before': {
      border: `1px solid ${theme.palette.colors.trueBlack}`
    },
    color: theme.palette.colors.trueBlack
  }
}));

interface TooltipProps {
  children: ReactElement
  title?: string
  titleHTML?: ReactFragment
  noWrap?: boolean
  interactive?: boolean
  className?: string
  placement?: 'bottom' | 'top' | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  onClick?: (e: React.MouseEvent) => void
}

export const Tooltip: React.FC<React.ComponentProps<typeof MuiTooltip> & TooltipProps> = ({
  children,
  title,
  titleHTML,
  noWrap = false,
  interactive = false,
  className = '',
  placement = 'bottom',
  onClick = () => {},
  ...props
}) => {

  return (
    <Root onClick={e => onClick(e)}>
      <MuiTooltip
        {...props}
        title={
          title.length === 0 ? (
            ''
          ) : (
            <React.Fragment>
              {titleHTML || (
                <span className={classes.text}>
                  {title ? title.charAt(0).toUpperCase() : ''}
                  {title ? title.slice(1) : ''}
                </span>
              )}
            </React.Fragment>
          )
        }
        classes={{
          // @ts-ignore
          arrow: classNames({
            [classes.arrow]: true
          }),
          tooltip: classNames({
            [classes.noWrap]: noWrap,
            [classes.tooltip]: true
          })
        }}
        placement={placement}
        arrow>
        {children}
      </MuiTooltip>
    </Root>
  );
}

export default Tooltip
