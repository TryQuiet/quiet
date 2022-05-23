import React from 'react'
import { makeStyles } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/nectar'

const useStyles = makeStyles(() => ({
  image: {
    maxWidth: '100%',
  },
  container: {
    maxWidth: '400px',
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
    <div className={classes.container}>
      <img className={classes.image} src={image} />
    </div>
  )
}

export default UploadedFile