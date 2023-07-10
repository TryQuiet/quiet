import React, { useState } from 'react'
import { Image, TouchableWithoutFeedback, View } from 'react-native'
// import { styled } from '@mui/material/styles'

// import CloseIcon from '@mui/icons-material/Close'
import { imagesExtensions } from '@quiet/state-manager'
// import Tooltip from '../../ui/Tooltip/Tooltip'
// import Icon from '../../ui/Icon/Icon'
// import fileIcon from '../../../static/images/fileIcon.svg'
import { FileContent, FilePreviewData } from '@quiet/types'
import { appImages } from '../../assets'

const PREFIX = 'UploadFilesPreviewsComponent'

const classes = {
  inputFiles: `${PREFIX}inputFiles`,
  wrapper: `${PREFIX}wrapper`,
  image: `${PREFIX}image`,
  fileIcon: `${PREFIX}fileIcon`,
  fileIconContainer: `${PREFIX}fileIconContainer`,
  closeIconContainer: `${PREFIX}closeIconContainer`,
  closeIcon: `${PREFIX}closeIcon`,
  imageContainer: `${PREFIX}imageContainer`,
  tooltip: `${PREFIX}tooltip`,
}

// const StyledFilePreviewComponent = styled('div')(() => ({
//   display: 'inline-block',
//   float: 'left',
//   cursor: 'pointer',

//   [`& .${classes.wrapper}`]: {
//     margin: '0 0 10px 10px',
//     width: '64px',
//     height: '64px',
//   },

//   [`& .${classes.image}`]: {
//     width: '64px',
//     height: '64px',
//     borderRadius: '15%',
//     objectFit: 'cover',
//   },

//   [`& .${classes.fileIcon}`]: {
//     width: '32px',
//     height: '40px',
//   },

//   [`& .${classes.fileIconContainer}`]: {
//     width: '64px',
//     height: '64px',
//     borderRadius: '15%',
//     backgroundColor: '#F0F0F0',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   [`& .${classes.closeIconContainer}`]: {
//     position: 'absolute',
//     margin: '0 0 0 51px', // Left margin is equal fileContainer width minus half the own width
//     padding: '0',
//     backgroundColor: 'white',
//     borderRadius: '100%',
//     width: '22px',
//     height: '22px',
//     transform: 'translate(50%, -50%)',
//     '&:hover': {
//       backgroundColor: '#dddddd',
//     },
//   },

//   [`& .${classes.closeIcon}`]: {
//     position: 'relative',
//     left: '50%',
//     top: '50%',
//     color: '#444444',
//     transform: 'translate(-50%, -50%)',
//     '&:hover': {
//       color: '#000000',
//     },
//     width: '17px',
//   },

//   [`& .${classes.tooltip}`]: {
//     marginTop: '8px',
//   },
// }))

// const StyledUploadFilesPreviewsComponent = styled('div')(() => ({
//   flexDirection: 'row',
//   flexWrap: 'wrap',
//   justifyContent: 'flexStart',
//   alignItems: 'baseline',
//   alignContent: 'stretch',
//   paddingRight: '50px',
// }))

export interface FilePreviewComponentProps {
  fileData: FileContent
  onClick: () => void
}

const FilePreviewComponent: React.FC<FilePreviewComponentProps> = ({ fileData, onClick }) => {
  console.log('FILE DATA', fileData)
  const imageType = imagesExtensions.includes(fileData.ext)
  const removePreviewIcon = appImages.icon_close
  const fileIcon = appImages.file_document

  return (
    <View
      style={{
        flexWrap: 'nowrap', // display: 'inline-block',
        alignItems: 'flex-start', // float: 'left'
        backgroundColor: 'teal',
      }}
    >
      <TouchableWithoutFeedback onPress={onClick}>
        <View
          style={{
            position: 'absolute',
            marginLeft: 0, // Left margin is equal fileContainer width minus half the own width
            padding: 0,
            backgroundColor: 'black',
            borderRadius: 100,
            width: 22,
            height: 22,
            transform: [{ translateX: 60 }, { translateY: -10 }],
            zIndex: 1000, // TODO: fixme
          }}
        >
          <Image
            source={removePreviewIcon}
            // resizeMode='contain'
            // resizeMethod='resize'
            style={{
              position: 'relative',
              left: 50,
              top: 50,
              // color: '#444444',
              transform: [{ translateX: -50 }, { translateY: -50 }],
              width: 17,
              height: 17,
              backgroundColor: 'yellow',
            }}
          />
        </View>
      </TouchableWithoutFeedback>
      <View
        style={{
          marginBottom: 10,
          marginLeft: 10,
          width: 64,
          height: 64,
          backgroundColor: 'blue',
        }}
      >
        {imageType && fileData.path ? (
          <img
            src={fileData.path}
            alt={fileData.name}
            style={{
              width: 64,
              height: 64,
              borderRadius: 15,
              objectFit: 'cover',
              backgroundColor: 'red',
            }}
          />
        ) : (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 15,
              backgroundColor: '#F0F0F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              source={fileIcon}
              style={{
                width: 32,
                height: 40,
              }}
            />
          </View>
        )}
      </View>
    </View>
  )
}

export interface UploadFilesPreviewsProps {
  filesData: FilePreviewData
  removeFile: (id: string) => void
}

const UploadFilesPreviewsComponent: React.FC<UploadFilesPreviewsProps> = ({ filesData, removeFile }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems: 'baseline',
        alignContent: 'stretch',
        paddingRight: 50,
      }}
    >
      {Object.entries(filesData).map(fileData => (
        <FilePreviewComponent key={fileData[0]} fileData={fileData[1]} onClick={() => removeFile(fileData[0])} />
      ))}
    </View>
  )
}

export default UploadFilesPreviewsComponent
