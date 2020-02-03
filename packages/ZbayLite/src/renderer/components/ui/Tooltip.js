import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as R from 'ramda'

import MuiTooltip from '@material-ui/core/Tooltip'
import { withStyles } from '@material-ui/core/styles'

function arrowGenerator (color, theme) {
  return {
    zIndex: 10,
    opacity: 1,
    '&[x-placement*="bottom"] $arrow': {
      opacity: 1,
      left: 0,
      marginTop: '-0.95em',

      '&::before': {
        borderWidth: '0 0.5em 0.5em 0.5em',
        borderColor: `transparent transparent ${color} transparent`
      }
    },
    '&[x-placement*="bottom-end"] $arrow': {
      opacity: 1,
      left: `calc(100% - ${theme.spacing(1)}px - ${constants.arrowSize}) !important`,
      marginTop: '-0.95em',
      '&::before': {
        borderWidth: '0 0.5em 0.5em 0.5em',
        borderColor: `transparent transparent ${color} transparent`
      }
    },
    '&[x-placement*="bottom-start"] $arrow': {
      opacity: 1,
      left: `${theme.spacing(1)}px !important`,
      marginTop: '-0.95em',
      '&::before': {
        borderWidth: '0 0.5em 0.5em 0.5em',
        borderColor: `transparent transparent ${color} transparent`
      }
    },
    '&[x-placement*="top"] $arrow': {
      bottom: 0,
      left: 0,
      marginBottom: '-0.95em',
      '&::before': {
        borderWidth: '0.5em 0.5em 0 0.5em',
        borderColor: `${color} transparent transparent transparent`
      }
    },
    '&[x-placement*="right"] $arrow': {
      left: 0,
      marginLeft: '-0.95em',
      '&::before': {
        borderWidth: '0.5em 0.5em 0.5em 0',
        borderColor: `transparent ${color} transparent transparent`
      }
    },
    '&[x-placement*="left"] $arrow': {
      right: 0,
      marginRight: '-0.95em',
      '&::before': {
        borderWidth: '0.5em 0 0.5em 0.5em',
        borderColor: `transparent transparent transparent ${color}`
      }
    }
  }
}

const constants = {
  arrowSize: '3em'
}

const styles = theme => ({
  noWrap: {
    maxWidth: 'none',
    filter: 'drop-shadow(0 0 0px #aaaaaa)'
  },
  tooltip: {
    background: theme.palette.colors.trueBlack,
    color: theme.typography.body1.color,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 8
  },
  arrow: {
    position: 'absolute',
    width: constants.arrowSize,
    height: constants.arrowSize,
    top: '0.5em',
    '&::before': {
      content: '""',
      margin: 'auto',
      display: 'block',
      width: 0,
      height: 0,
      borderStyle: 'solid'
    }
  },
  text: {
    color: theme.palette.colors.white,
    fontSize: 12,
    fontWeight: 500
  },
  arrowPopper: arrowGenerator(theme.palette.colors.trueBlack, theme)
})

export const Tooltip = ({ classes, children, title, noWrap, className, onClick, ...props }) => {
  const [arrowRef, setArrowRef] = useState(null)
  return (
    <span onClick={onClick}>
      <MuiTooltip
        {...props}
        title={
          <React.Fragment>
            <span className={classes.text}>{title.charAt(0).toUpperCase() + title.slice(1)}</span>
            <span className={classes.arrow} ref={setArrowRef} />
          </React.Fragment>
        }
        classes={{
          tooltip: classNames({
            [classes.noWrap]: noWrap,
            [className]: className,
            [classes.tooltip]: true
          }),
          popper: classes.arrowPopper
        }}
        PopperProps={{
          popperOptions: {
            modifiers: {
              arrow: {
                enabled: Boolean(arrowRef),
                element: arrowRef
              }
            }
          }
        }}
      >
        {children}
      </MuiTooltip>
    </span>
  )
}

const joiningProd = R.compose(
  R.map(R.join('')),
  R.xprod
)

Tooltip.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.element.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  placement: PropTypes.oneOf(joiningProd(['bottom', 'top'], ['-start', '-end', ''])),
  interactive: PropTypes.bool,
  className: PropTypes.string,
  noWrap: PropTypes.bool,
  onClick: PropTypes.func
}

Tooltip.defaultProps = {
  noWrap: true,
  interactive: false,
  className: '',
  placement: 'bottom',
  onClick: () => {}
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(Tooltip)
