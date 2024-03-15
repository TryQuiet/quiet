import React from 'react'
import Typography from '@mui/material/Typography'
import { Grid, alpha } from '@mui/material'
import { styled } from '@mui/material/styles'
import clsx from 'clsx'
import classNames from 'classnames'

// import "./AnimatedEllipsis.css";

const PREFIX = 'AnimatedEllipsis'

const classes = {
  wrapper: `${PREFIX}-wrapper`,
  content: `${PREFIX}-content`,
  dot1: `${PREFIX}-dot1`,
  dot2: `${PREFIX}-dot2`,
  dot3: `${PREFIX}-dot3`,
  dot1Anim: `${PREFIX}-dot1-animation`
}

const Dot1 = styled("div")({
  '@keyframes visibility': {
    '0%': {
      opacity: 0,
      // color: alpha(color?.toString() || 'textPrimary', 0)
    },
    '65%': {
      opacity: 1,
      // color: alpha(color?.toString() || 'textPrimary', 1.0)
    },
    '66%': {
      opacity: 0.5,
      // color: alpha(color?.toString() || 'textPrimary', 0.5)
    },
    '100%': {
      opacity: 0,
      // color: alpha(color?.toString() || 'textPrimary', 0)
    },
  },
  animation: '$visibility 2000ms linear infinite',
});

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.wrapper}`]: {
    display: 'flex',
    flexDirection: 'row',
  },

  [`& .${classes.dot1}`]: {
    animation: `$dot1Visibility 2000ms linear 200ms infinite`,
  },

  [`& .${classes.dot1Anim}`]: {
    animationName: '$dot1Visibility',
    animationDuration: '2s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },

  '@keyframes dot1Visibility': {
    '0%': {
      opacity: 0,
      // color: alpha(color?.toString() || 'textPrimary', 0)
    },
    '65%': {
      opacity: 1,
      // color: alpha(color?.toString() || 'textPrimary', 1.0)
    },
    '66%': {
      opacity: 0.5,
      // color: alpha(color?.toString() || 'textPrimary', 0.5)
    },
    '100%': {
      opacity: 0,
      // color: alpha(color?.toString() || 'textPrimary', 0)
    },
  },
}))

interface AnimatedEllipsis {
  content: string
  color: string
  fontSize: number
  fontWeight: string
  justifyContent: string
}

export const AnimatedEllipsis: React.FC<AnimatedEllipsis> = ({
  content,
  color,
  fontSize,
  fontWeight,
  justifyContent,
}) => {
  return (
    <StyledGrid
      item
      style={{
        display: 'flex',
        flexDirection: 'row',
      }}
      className={classNames({[classes.wrapper]: true})}
    >
      <Typography className={clsx(classes.content)} color={color} fontSize={fontSize} fontWeight={fontWeight}>
        {content}
      </Typography>
      <Grid className={clsx(classes.dot1, classes.dot1Anim)}>
        <Typography color={color} fontSize={fontSize} fontWeight={fontWeight}>
          .
        </Typography>
      </Grid>
      <Grid>
        <Typography className={clsx(classes.dot2)} color={color} fontSize={fontSize} fontWeight={fontWeight}>
          .
        </Typography>
      </Grid>
      <Grid>
        <Typography className={clsx(classes.dot3)} color={color} fontSize={fontSize} fontWeight={fontWeight}>
          .
        </Typography>
      </Grid>
    </StyledGrid>
  )
}

export default AnimatedEllipsis
