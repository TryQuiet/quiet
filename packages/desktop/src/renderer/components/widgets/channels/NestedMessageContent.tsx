import React, { ReactNode } from 'react'
import theme from '../../../theme'
import { Grid, makeStyles, Typography } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/state-manager'
import classNames from 'classnames'
import UploadedFile from './UploadedFile'
import { UseModalTypeWrapper } from '../../../containers/hooks'
import Linkify from 'react-linkify'

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
  openUrl: (url: string) => void
  uploadedFileModal?: ReturnType<
  UseModalTypeWrapper<{
    src: string
  }>['types']
  >
}

export const NestedMessageContent: React.FC<NestedMessageContentProps> = ({
  message,
  pending,
  openUrl,
  uploadedFileModal
}) => {
  const classes = useStyles({})

  const componentDecorator = (decoratedHref: string, decoratedText: string, key: number): ReactNode => {
    return (
      <a onClick={() => { openUrl(decoratedHref) }} key={key}>
        {decoratedText}
      </a>
    )
  }

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
          <Linkify componentDecorator={componentDecorator}>{message.message}</Linkify>
        </Typography>
      )}
    </Grid>
  )
}

export default NestedMessageContent
