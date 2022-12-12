import React from 'react'

import { styled } from '@mui/material/styles'

const PREFIX = 'IconCopy'

const classes = {
  root: `${PREFIX}root`,
  main: `${PREFIX}main`,
  squareTop: `${PREFIX}squareTop`,
  gradient: `${PREFIX}gradient`,
  squareFill: `${PREFIX}squareFill`,
  squareBottom: `${PREFIX}squareBottom`
}

const Root = styled('div')({
  [`& .${classes.root}`]: {},
  [`& .${classes.main}`]: {
    padding: 0,
    margin: 0
  },
  [`& .${classes.squareTop}`]: {
    position: 'absolute',
    left: 4,
    top: 7
  },
  [`& .${classes.gradient}`]: {
    maxWidth: 50,
    padding: 2,
    position: 'relative',
    backgroundImage: 'linear-gradient(315deg, #521576, #e42656)'
  },
  [`& .${classes.squareFill}`]: {
    background: 'white',
    color: 'white',
    padding: 5
  },
  [`& .${classes.squareBottom}`]: {
    position: 'absolute',
    left: 9,
    top: 2
  }
})

export const IconCopy: React.FC = () => {
  return (
    <Root>
      <div className={classes.squareTop}>
        <div className={classes.gradient}>
          <div className={classes.squareFill} />
        </div>
      </div>
      <div className={classes.squareBottom}>
        <div className={classes.gradient}>
          <div className={classes.squareFill} />
        </div>
      </div>
    </Root>
  )
}

export default IconCopy
