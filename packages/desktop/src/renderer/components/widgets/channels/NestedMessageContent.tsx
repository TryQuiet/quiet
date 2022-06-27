import React from 'react'
import theme from '../../../theme'
import { Grid, makeStyles, Typography } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/state-manager'
import classNames from 'classnames'
import UploadedFile from '../../Channel/File/UploadedImage/UploadedImage'
import { UseModalTypeWrapper } from '../../../containers/hooks'

const useStyles = makeStyles(() => ({
  message: {
    fontSize: '0.855rem',
    whiteSpace: 'pre-line',
    lineHeight: '21px',
    overflowWrap: 'anywhere'
  },
  pending: {
    color: theme.palette.colors.lightGray
  },
  info: {
    color: theme.palette.colors.white
  }
}))

export interface NestedMessageContentProps {
  message: DisplayableMessage
  pending: boolean
  uploadedFileModal?: ReturnType<
  UseModalTypeWrapper<{
    src: string
  }>['types']
  >
}

export const NestedMessageContent: React.FC<NestedMessageContentProps> = ({
  message,
  pending,
  uploadedFileModal
}) => {
  const classes = useStyles({})

  return (
    <Grid item>
      {message.type === 2 ? ( // 2 stands for MessageType.Image (cypress tests incompatibility with enums)
        <div
          className={classNames({
            [classes.message]: true,
            [classes.pending]: pending
          })}
          data-testid={`messagesGroupContent-${message.id}`}>
          <UploadedFile message={message} uploadedFileModal={uploadedFileModal} />
        </div>
      ) : (
        <Typography
          component={'span'}
          className={classNames({
            [classes.message]: true,
            [classes.pending]: pending
          })}
          data-testid={`messagesGroupContent-${message.id}`}>
          {message.message}
        </Typography>
      )}
    </Grid>
  )
}

export default NestedMessageContent
