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
  },
  image: {
    maxWidth: '50%'
  }
}))

export interface UploadedFileProps {
  message: DisplayableMessage
}

export const UploadedFile: React.FC<UploadedFileProps> = ({ message }) => {
  const classes = useStyles({})
  const image = URL.createObjectURL(
    new Blob([message.message], { type: 'image/png' } /* (1) */)
  );
  console.log('File', message)
  return (
    <div>
      <img className={classes.image} src={image} />
    </div>
  )
}

export default UploadedFile