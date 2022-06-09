import React from 'react'
import theme from '../../../theme'
import { Grid, makeStyles, Typography } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/state-manager'
import classNames from 'classnames'
import UploadedFile from './UploadedFile'
import { useModal } from '../../../containers/hooks'

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
  uploadedFileModal?: ReturnType<typeof useModal>
}

export const NestedMessageContent: React.FC<NestedMessageContentProps> = ({ message, pending, uploadedFileModal }) => {
  const classes = useStyles({})

  return (
    <Grid item>
      {message.type === 1 // 1 stands for MessageType.Basic (cypress tests incompatibility with enums)
        ? <Typography
          component={'span'}
          className={classNames({
            [classes.message]: true,
            [classes.pending]: pending
          })}
          data-testid={`messagesGroupContent-${message.id}`}>
          {
            message.message
          }
        </Typography>
        : <div className={classNames({
          [classes.message]: true,
          [classes.pending]: pending
        })}
        data-testid={`messagesGroupContent-${message.id}`}
        >
          <UploadedFile message={message} uploadedFileModal={uploadedFileModal} />
        </div>
      }

    </Grid>
  )
}

export default NestedMessageContent
