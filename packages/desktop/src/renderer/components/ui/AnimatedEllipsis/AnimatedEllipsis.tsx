import React from 'react'
import Typography from '@mui/material/Typography'
import { Grid } from '@mui/material'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'

const PREFIX = 'AnimatedEllipsis'

const classes = {
  wrapper: `${PREFIX}-wrapper`,
  content: `${PREFIX}-content`,
  dot1: `${PREFIX}-dot1`,
  dot2: `${PREFIX}-dot2`,
  dot3: `${PREFIX}-dot3`,
}

const getAnimationName = (className: string) => `${className}-visibility-anim`
const getAnimationProperties = (className: string) => {
  return {
    animationName: getAnimationName(className),
    animationDuration: '1800ms',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  }
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.wrapper}`]: {
    display: 'flex',
    flexDirection: 'row',
  },

  // dot 1

  [`& .${classes.dot1}`]: getAnimationProperties(classes.dot1),

  [`@keyframes ${getAnimationName(classes.dot1)}`]: {
    '0%': {
      opacity: 1,
    },
    '65%': {
      opacity: 1,
    },
    '66%': {
      opacity: 0.5,
    },
    '75%': {
      opacity: 0.3,
    },
    '90%': {
      opacity: 0.1,
    },
    '100%': {
      opacity: 0,
    },
  },

  // dot2

  [`& .${classes.dot2}`]: getAnimationProperties(classes.dot2),

  [`@keyframes ${getAnimationName(classes.dot2)}`]: {
    '0%': {
      opacity: 0,
    },
    '5%': {
      opacity: 0.1,
    },
    '15%': {
      opacity: 0.25,
    },
    '18%': {
      opacity: 0.5,
    },
    '20%': {
      opacity: 0.75,
    },
    '22%': {
      opacity: 1,
    },
    '65%': {
      opacity: 1,
    },
    '66%': {
      opacity: 0.5,
    },
    '75%': {
      opacity: 0.3,
    },
    '90%': {
      opacity: 0.1,
    },
    '100%': {
      opacity: 0,
    },
  },

  // dot 3

  [`& .${classes.dot3}`]: getAnimationProperties(classes.dot3),

  [`@keyframes ${getAnimationName(classes.dot3)}`]: {
    '0%': {
      opacity: 0,
    },
    '25%': {
      opacity: 0.1,
    },
    '35%': {
      opacity: 0.25,
    },
    '39%': {
      opacity: 0.5,
    },
    '43%': {
      opacity: 0.75,
    },
    '44%': {
      opacity: 1,
    },
    '65%': {
      opacity: 1,
    },
    '66%': {
      opacity: 0.5,
    },
    '75%': {
      opacity: 0.3,
    },
    '90%': {
      opacity: 0.1,
    },
    '100%': {
      opacity: 0,
    },
  },
}))

interface AnimatedEllipsis {
  content: string
  color: string
  fontSize: number
  fontWeight: string
}

export const AnimatedEllipsis: React.FC<AnimatedEllipsis> = ({ content, color, fontSize, fontWeight }) => {
  return (
    <StyledGrid item>
      <Grid item className={classNames({ [classes.wrapper]: true })}>
        <Typography
          className={classNames({ [classes.content]: true })}
          color={color}
          fontSize={fontSize}
          fontWeight={fontWeight}
        >
          {content}
        </Typography>
        <Typography
          className={classNames({ [classes.dot1]: true })}
          color={color}
          fontSize={fontSize}
          fontWeight={fontWeight}
        >
          .
        </Typography>
        <Typography
          className={classNames({ [classes.dot2]: true })}
          color={color}
          fontSize={fontSize}
          fontWeight={fontWeight}
        >
          .
        </Typography>
        <Typography
          className={classNames({ [classes.dot3]: true })}
          color={color}
          fontSize={fontSize}
          fontWeight={fontWeight}
        >
          .
        </Typography>
      </Grid>
    </StyledGrid>
  )
}

export default AnimatedEllipsis
