import React from 'react'
import theme from '../../../theme'
import { Grid, makeStyles, Typography } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/state-manager'
import classNames from 'classnames'
import UploadedFile from './UploadedFile'

const useStyles = makeStyles(() => ({
  message: {
    fontSize: '0.855rem',
    whiteSpace: 'pre-line',
    lineHeight: '21px',
    overflowWrap: 'anywhere'
  },
  pending: {
    color: theme.palette.colors.lightGray
  }
}))

export interface NestedMessageContentProps {
  message: DisplayableMessage
  pending: boolean
  index: number
}

export const NestedMessageContent: React.FC<NestedMessageContentProps> = ({ message, pending, index }) => {
  const classes = useStyles({})

  return (
    <Grid item>
      <Typography
        component={'span'}
        className={classNames({
          [classes.message]: true,
          [classes.pending]: pending
        })}
        data-testid={`messagesGroupContent-${message.id}`}>
        {
          message.type === 1 ? message.message : <UploadedFile message={message} /> // 1 stands for MessageType.Basic (cypress tests incompatibility with enums)
        }
      </Typography>
    </Grid>
  )
}

export default NestedMessageContent
