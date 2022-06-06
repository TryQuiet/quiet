import React, { useEffect, useState } from 'react'
import { CircularProgress, makeStyles, Theme } from '@material-ui/core'
import { DisplayableMessage } from '@quiet/state-manager'
import { useModal } from '../../../containers/hooks'
import { ModalName } from '../../../sagas/modals/modals.types'
import UploadedFileModal from './UploadedFileModal'
import imagePlaceholderIcon from '../../../static/images/imagePlaceholderIcon.svg'
import Icon from '../../ui/Icon/Icon'

const useStyles = makeStyles<Theme>(theme => ({
  image: {
    maxWidth: '100%'
  },
  container: {
    maxWidth: '400px',
    cursor: 'pointer'
  },
  placeholderWrapper: {
    maxWidth: '400px'
  },
  placeholder: {
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginLeft: '0.5em'
  },
  placeholderIcon: {
    marginRight: '0.5em'
  },
  fileName: {
    color: 'gray'
  }
}))

interface UploadedFilePlaceholderProps {
  imageWidth: number,
  imageHeight: number,
  fileName: string,
  fileExt: string 
}

export const UploadedFilePlaceholder: React.FC<UploadedFilePlaceholderProps> = ({
  imageWidth,
  imageHeight,
  fileName,
  fileExt
 }) => {
  const classes = useStyles({})
  return (
    <div className={classes.placeholderWrapper} style={{aspectRatio: '' + imageWidth / imageHeight}} data-testid={'imagePlaceholder'} >
      <p className={classes.fileName}>{fileName}{fileExt}</p>
      <div className={classes.placeholder}>
        <Icon src={imagePlaceholderIcon} className={classes.placeholderIcon}/>
        <CircularProgress color='inherit' size={16} />
      </div>
    </div>
  )
}