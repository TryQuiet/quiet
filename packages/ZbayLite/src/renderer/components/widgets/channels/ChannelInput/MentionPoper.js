import React from 'react'
import PropTypes from 'prop-types'
import { Scrollbars } from 'react-custom-scrollbars'

import { withStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Popper from '@material-ui/core/Popper'
import Grid from '@material-ui/core/Grid'

const maxHeight = 230
const styles = theme => ({
  root: {
    maxHeight: maxHeight,
    width: 307,
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0px 2px 25px rgba(0,0,0,0.2)',
    marginBottom: 10
  },
  thumb: {
    backgroundColor: 'rgba(0,0,0,0.46)',
    borderRadius: 100,
    marginLeft: -3,
    width: 8
  },
  divider: {
    width: 14,
    borderLeft: '1px solid',
    borderColor: 'rgba(0,0,0,0.08)'
  }
})

export const MentionPoper = ({ classes, anchorEl, children, selected }) => {
  const anchor = React.useRef()
  const scrollbarRef = React.useRef()
  const poperRef = React.useRef()
  const [height, setHeight] = React.useState(0)
  const [positionY, setPositionY] = React.useState(0)
  const [positionX, setPositionX] = React.useState(0)
  React.useEffect(() => {
    if (anchorEl && poperRef.current) {
      if (children.length) {
        setPositionY(anchorEl.offsetTop - poperRef.current.clientHeight)
        setPositionX(anchorEl.offsetLeft)
      } else {
        setPositionY(0)
        setPositionX(0)
      }
    }
  })
  React.useEffect(() => {
    if (anchor && anchor.current) {
      if (anchor.current.clientHeight > maxHeight) {
        setHeight(maxHeight)
      } else {
        setHeight(anchor.current.clientHeight)
      }
    } else {
      setHeight(0)
    }
  }, [children])

  React.useEffect(() => {
    if (anchor && anchor.current && anchor.current.children[selected]) {
      if (
        anchor.current.children[selected].offsetTop >
        scrollbarRef.current.getScrollTop() +
          maxHeight -
          anchor.current.children[selected].clientHeight
      ) {
        scrollbarRef.current.scrollTop(
          anchor.current.children[selected].offsetTop +
            anchor.current.children[selected].clientHeight -
            maxHeight
        )
      }
      if (
        anchor.current.children[selected].offsetTop <
        scrollbarRef.current.getScrollTop()
      ) {
        scrollbarRef.current.scrollTop(
          anchor.current.children[selected].offsetTop
        )
      }
    }
  }, [selected])
  return (
    <Popper
      open
      ref={poperRef}
      className={classes.root}
      style={{
        transform: `translate3d(${positionX}px,${positionY}px,0px`,
        zIndex: positionX === 0 || positionY === 0 ? -1 : 0
      }}
    >
      <Paper>
        <Scrollbars
          ref={scrollbarRef}
          autoHideTimeout={500}
          style={{ height: height }}
          renderThumbVertical={() => <div className={classes.thumb} />}
        >
          <Grid>
            <Grid container>
              <Grid item xs ref={anchor}>
                {children}
              </Grid>
              <div className={classes.divider} />
            </Grid>
          </Grid>
        </Scrollbars>
      </Paper>
    </Popper>
  )
}
MentionPoper.propTypes = {
  classes: PropTypes.object.isRequired,
  anchorEl: PropTypes.object.isRequired,
  children: PropTypes.array,
  selected: PropTypes.number
}

export default React.memo(withStyles(styles)(MentionPoper), (before, after) => {
  let isSameHtml
  if (before.anchorEl === null || after.anchorEl === null) {
    isSameHtml = before.anchorEl === after.anchorEl
  } else {
    isSameHtml = before.anchorEl.id === after.anchorEl.id
  }
  return (
    isSameHtml &&
    before.children.length === after.children.length &&
    before.selected === after.selected
  )
})
