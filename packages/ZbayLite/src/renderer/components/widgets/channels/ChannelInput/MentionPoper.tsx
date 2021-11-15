import React, { ReactElement } from 'react'
import { Scrollbars } from 'rc-scrollbars'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Popper from '@material-ui/core/Popper'
import Grid from '@material-ui/core/Grid'

function isDivElement(element: Element | undefined): element is HTMLDivElement {
  return element?.nodeName === 'div'
}

const maxHeight = 230
const useStyles = makeStyles({
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

interface MentionPoperProps {
  anchorEl: HTMLDivElement
  children: ReactElement[]
  selected: number
}

export const MentionPoper: React.FC<MentionPoperProps> = ({ anchorEl, children, selected }) => {
  const classes = useStyles({})

  const anchor = React.useRef<HTMLDivElement>(null)

  const popperRef = React.useRef<typeof Popper>()

  const scrollbarRef = React.useRef<Scrollbars>(null)

  const [height, setHeight] = React.useState(0)
  const [positionY, setPositionY] = React.useState(0)
  const [positionX, setPositionX] = React.useState(0)
  React.useEffect(() => {
    if (anchorEl && popperRef.current) {
      if (children.length) {
        const popperContainer = (popperRef.current as unknown) as HTMLDivElement
        setPositionY(anchorEl.offsetTop - popperContainer.clientHeight)
        setPositionX(anchorEl.offsetLeft)
      } else {
        setPositionY(0)
        setPositionX(0)
      }
    }
  }, [children, anchorEl, popperRef])

  React.useEffect(() => {
    if (anchor?.current) {
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
    const element = anchor.current?.children[selected]
    if (isDivElement(element) && scrollbarRef?.current) {
      if (
        element.offsetTop >
        scrollbarRef.current.getScrollTop() + maxHeight - element.clientHeight
      ) {
        scrollbarRef.current.scrollTop(element.offsetTop + element.clientHeight - maxHeight)
      }
      if (element.offsetTop < scrollbarRef.current.getScrollTop()) {
        scrollbarRef.current.scrollTop(element.offsetTop)
      }
    }
  }, [selected])

  return (
    <Popper
      open
      className={classes.root}
      style={{
        transform: `translate3d(${positionX}px,${positionY}px,0px`,
        zIndex: positionX && positionY ? 0 : -1
      }}
      // @ts-expect-error
      ref={popperRef}>
      <Paper>
        <Scrollbars
          ref={scrollbarRef}
          autoHideTimeout={500}
          style={{ height: height }}
          renderThumbVertical={() => <div className={classes.thumb} />}>
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

export default MentionPoper
