import React from 'react'
import theme from '../../../theme'
import { Grid, makeStyles, Typography } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/nectar'
import classNames from 'classnames'

const useStyles = makeStyles(() => ({
  message: {
    marginTop: '-3px',
    fontSize: '0.855rem',
    whiteSpace: 'pre-line',
    lineHeight: '21px',
    overflowWrap: 'anywhere'
  },
  firstMessage: {
    paddingTop: 0
  },
  nextMessage: {
    paddingTop: 4
  },
  pending: {
    color: theme.palette.colors.lightGray
  }
}))

export interface NestedMessageContentProps {
  message: DisplayableMessage
  index: number
}

export const NestedMessageContent: React.FC<NestedMessageContentProps> = ({ message, index }) => {
  const classes = useStyles({})

  const outerDivStyle = index > 0 ? classes.nextMessage : classes.firstMessage

  return (
    <Grid item className={outerDivStyle}>
      <Typography
        className={classNames({
          [classes.message]: true,
          [classes.pending]: true
        })}
        data-testid={`messagesGroupContent-${message.id}`}>
        {message.message}
      </Typography>
    </Grid>
  )
}

export default NestedMessageContent
